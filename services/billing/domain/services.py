"""
Billing & Subscription Domain Services
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from shared.domain import DomainService, Specification
from .models import (
    Invoice, Subscription, LineItem, Money, BillingCycle, 
    InvoiceStatus, SubscriptionStatus, PricingModel
)
from .repositories import InvoiceRepository, SubscriptionRepository


class InvoiceGenerationService(DomainService):
    """Service for generating invoices from subscriptions and projects"""
    
    def __init__(self, invoice_repository: InvoiceRepository):
        self.invoice_repository = invoice_repository
    
    async def generate_subscription_invoice(
        self, 
        subscription: Subscription,
        billing_period_start: datetime,
        billing_period_end: datetime
    ) -> Invoice:
        """Generate invoice for subscription billing period"""
        
        # Calculate invoice number
        invoice_number = await self._generate_invoice_number()
        
        # Calculate due date (typically 30 days from issue)
        due_date = datetime.utcnow() + timedelta(days=30)
        
        # Create line items based on subscription
        line_items = []
        
        # Base subscription fee
        base_amount = subscription.calculate_current_amount()
        if base_amount.amount > 0:
            line_items.append(LineItem(
                description=f"{subscription.plan.name} - {billing_period_start.strftime('%Y-%m-%d')} to {billing_period_end.strftime('%Y-%m-%d')}",
                quantity=Decimal(str(subscription.quantity)),
                unit_price=Money(
                    amount=base_amount.amount / subscription.quantity,
                    currency=base_amount.currency
                )
            ))
        
        # Usage-based charges
        if subscription.plan.pricing_model == PricingModel.USAGE_BASED:
            for usage_type, usage_amount in subscription.usage_tracking.items():
                if usage_amount > 0:
                    # Get usage rate from plan (simplified)
                    usage_rate = 0.01  # $0.01 per unit - would be configurable
                    line_items.append(LineItem(
                        description=f"{usage_type.replace('_', ' ').title()} Usage",
                        quantity=Decimal(str(usage_amount)),
                        unit_price=Money(amount=usage_rate, currency=base_amount.currency)
                    ))
        
        # Setup fee (for first invoice)
        if subscription.plan.setup_fee and not await self._has_previous_invoices(subscription.id):
            line_items.append(LineItem(
                description="Setup Fee",
                quantity=Decimal('1'),
                unit_price=subscription.plan.setup_fee
            ))
        
        # Create invoice
        invoice = Invoice.create(
            invoice_number=invoice_number,
            client_id=subscription.client_id,
            subscription_id=subscription.id,
            due_date=due_date,
            line_items=line_items,
            billing_address=subscription.billing_address
        )
        
        return invoice
    
    async def generate_project_invoice(
        self,
        client_id: str,
        project_id: str,
        line_items: List[LineItem],
        due_date: datetime = None,
        billing_address = None
    ) -> Invoice:
        """Generate invoice for project billing"""
        
        invoice_number = await self._generate_invoice_number()
        due_date = due_date or datetime.utcnow() + timedelta(days=30)
        
        invoice = Invoice.create(
            invoice_number=invoice_number,
            client_id=client_id,
            project_id=project_id,
            due_date=due_date,
            line_items=line_items,
            billing_address=billing_address
        )
        
        return invoice
    
    async def _generate_invoice_number(self) -> str:
        """Generate unique invoice number"""
        # Simple implementation - in production would be more sophisticated
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"INV-{timestamp}"
    
    async def _has_previous_invoices(self, subscription_id: str) -> bool:
        """Check if subscription has previous invoices"""
        invoices = await self.invoice_repository.find_by_subscription_id(subscription_id)
        return len(invoices) > 0


class BillingCalculationService(DomainService):
    """Service for complex billing calculations"""
    
    def calculate_prorated_amount(
        self,
        base_amount: Money,
        billing_cycle: BillingCycle,
        days_used: int
    ) -> Money:
        """Calculate prorated amount for partial billing periods"""
        
        cycle_days = {
            BillingCycle.MONTHLY: 30,
            BillingCycle.QUARTERLY: 90,
            BillingCycle.ANNUALLY: 365
        }.get(billing_cycle, 30)
        
        if days_used >= cycle_days:
            return base_amount
        
        prorated_amount = base_amount.amount * (days_used / cycle_days)
        return Money(amount=prorated_amount, currency=base_amount.currency)
    
    def calculate_tax(
        self,
        amount: Money,
        tax_rate: Decimal,
        tax_jurisdiction: str = None
    ) -> Money:
        """Calculate tax amount based on jurisdiction and rate"""
        
        # Simplified tax calculation - in production would integrate with tax service
        tax_amount = float(amount.amount * tax_rate / 100)
        return Money(amount=tax_amount, currency=amount.currency)
    
    def calculate_discount(
        self,
        amount: Money,
        discount_percentage: Decimal = None,
        discount_amount: Money = None
    ) -> Money:
        """Calculate discount amount"""
        
        if discount_amount:
            return discount_amount
        
        if discount_percentage:
            discount = amount.amount * float(discount_percentage) / 100
            return Money(amount=discount, currency=amount.currency)
        
        return Money(amount=0.0, currency=amount.currency)
    
    def calculate_tiered_pricing(
        self,
        quantity: int,
        tiers: List[Dict[str, Any]]
    ) -> Money:
        """Calculate amount using tiered pricing"""
        
        total_amount = 0.0
        remaining_quantity = quantity
        currency = "USD"
        
        for tier in sorted(tiers, key=lambda t: t['min_quantity']):
            if remaining_quantity <= 0:
                break
            
            tier_min = tier['min_quantity']
            tier_max = tier.get('max_quantity')
            tier_price = tier['unit_price']
            currency = tier_price.get('currency', 'USD')
            
            # Calculate quantity for this tier
            if tier_max:
                tier_quantity = min(remaining_quantity, tier_max - tier_min + 1)
            else:
                tier_quantity = remaining_quantity
            
            # Add tier amount
            total_amount += tier_quantity * tier_price['amount']
            remaining_quantity -= tier_quantity
        
        return Money(amount=total_amount, currency=currency)


class SubscriptionLifecycleService(DomainService):
    """Service for managing subscription lifecycle"""
    
    def __init__(self, subscription_repository: SubscriptionRepository):
        self.subscription_repository = subscription_repository
    
    async def process_trial_expirations(self) -> List[str]:
        """Process expired trial subscriptions"""
        expired_trials = await self.subscription_repository.find_expiring_trials(days=0)
        processed_subscriptions = []
        
        for subscription in expired_trials:
            if subscription.is_trial_expired():
                # Convert to active or cancel based on business rules
                if await self._should_auto_activate(subscription):
                    subscription.activate()
                else:
                    subscription.cancel()
                
                await self.subscription_repository.save(subscription)
                processed_subscriptions.append(subscription.id)
        
        return processed_subscriptions
    
    async def process_billing_renewals(self, date: datetime = None) -> List[str]:
        """Process subscription renewals due for billing"""
        date = date or datetime.utcnow()
        due_subscriptions = await self.subscription_repository.find_due_for_billing(date)
        processed_subscriptions = []
        
        for subscription in due_subscriptions:
            # Update next billing date
            subscription.next_billing_date = self._calculate_next_billing_date(
                subscription.next_billing_date,
                subscription.plan.billing_cycle
            )
            
            await self.subscription_repository.save(subscription)
            processed_subscriptions.append(subscription.id)
        
        return processed_subscriptions
    
    async def handle_failed_payments(self) -> List[str]:
        """Handle subscriptions with failed payments"""
        past_due_subscriptions = await self.subscription_repository.find_past_due_subscriptions()
        processed_subscriptions = []
        
        for subscription in past_due_subscriptions:
            days_past_due = (datetime.utcnow() - subscription.next_billing_date).days
            
            if days_past_due > 30:  # Cancel after 30 days
                subscription.cancel()
            elif days_past_due > 7:  # Suspend after 7 days
                subscription.suspend("Payment past due")
            
            await self.subscription_repository.save(subscription)
            processed_subscriptions.append(subscription.id)
        
        return processed_subscriptions
    
    async def _should_auto_activate(self, subscription: Subscription) -> bool:
        """Determine if trial subscription should auto-activate"""
        # Business logic for auto-activation
        # Could check payment method, client status, etc.
        return True  # Simplified
    
    def _calculate_next_billing_date(self, current_date: datetime, billing_cycle: BillingCycle) -> datetime:
        """Calculate next billing date"""
        if billing_cycle == BillingCycle.MONTHLY:
            return current_date + timedelta(days=30)
        elif billing_cycle == BillingCycle.QUARTERLY:
            return current_date + timedelta(days=90)
        elif billing_cycle == BillingCycle.ANNUALLY:
            return current_date + timedelta(days=365)
        else:
            return current_date


class RevenueAnalyticsService(DomainService):
    """Service for revenue analytics and reporting"""
    
    def __init__(
        self, 
        invoice_repository: InvoiceRepository,
        subscription_repository: SubscriptionRepository
    ):
        self.invoice_repository = invoice_repository
        self.subscription_repository = subscription_repository
    
    async def calculate_monthly_recurring_revenue(self) -> Dict[str, float]:
        """Calculate MRR by subscription plan"""
        active_subscriptions = await self.subscription_repository.find_active_subscriptions()
        
        mrr_by_plan = {}
        total_mrr = 0.0
        
        for subscription in active_subscriptions:
            monthly_amount = self._normalize_to_monthly(
                subscription.calculate_current_amount(),
                subscription.plan.billing_cycle
            )
            
            plan_name = subscription.plan.name
            mrr_by_plan[plan_name] = mrr_by_plan.get(plan_name, 0.0) + monthly_amount
            total_mrr += monthly_amount
        
        mrr_by_plan['total'] = total_mrr
        return mrr_by_plan
    
    async def calculate_revenue_metrics(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate comprehensive revenue metrics"""
        
        # Get paid invoices in period
        invoices = await self.invoice_repository.find_by_date_range(start_date, end_date)
        paid_invoices = [inv for inv in invoices if inv.status == InvoiceStatus.PAID]
        
        total_revenue = sum(inv.total_amount.amount for inv in paid_invoices)
        invoice_count = len(paid_invoices)
        
        # Revenue by client type (would need client data)
        revenue_by_type = {}
        
        # Revenue by service type
        revenue_by_service = {
            'subscription': 0.0,
            'project': 0.0,
            'one_time': 0.0
        }
        
        for invoice in paid_invoices:
            if invoice.subscription_id:
                revenue_by_service['subscription'] += invoice.total_amount.amount
            elif invoice.project_id:
                revenue_by_service['project'] += invoice.total_amount.amount
            else:
                revenue_by_service['one_time'] += invoice.total_amount.amount
        
        return {
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'total_revenue': total_revenue,
            'invoice_count': invoice_count,
            'average_invoice_value': total_revenue / invoice_count if invoice_count > 0 else 0,
            'revenue_by_service': revenue_by_service,
            'revenue_by_type': revenue_by_type
        }
    
    def _normalize_to_monthly(self, amount: Money, billing_cycle: BillingCycle) -> float:
        """Normalize amount to monthly value for MRR calculation"""
        if billing_cycle == BillingCycle.MONTHLY:
            return amount.amount
        elif billing_cycle == BillingCycle.QUARTERLY:
            return amount.amount / 3
        elif billing_cycle == BillingCycle.ANNUALLY:
            return amount.amount / 12
        else:
            return 0.0


# Specifications for billing business rules
class OverdueInvoiceSpecification(Specification):
    """Specification for overdue invoices"""
    
    def is_satisfied_by(self, invoice: Invoice) -> bool:
        return invoice.is_overdue()


class HighValueInvoiceSpecification(Specification):
    """Specification for high value invoices"""
    
    def __init__(self, threshold: float = 10000.0):
        self.threshold = threshold
    
    def is_satisfied_by(self, invoice: Invoice) -> bool:
        return invoice.total_amount.amount >= self.threshold


class ActiveSubscriptionSpecification(Specification):
    """Specification for active subscriptions"""
    
    def is_satisfied_by(self, subscription: Subscription) -> bool:
        return subscription.status == SubscriptionStatus.ACTIVE


class TrialExpiringSpecification(Specification):
    """Specification for trials expiring soon"""
    
    def __init__(self, days: int = 7):
        self.days = days
    
    def is_satisfied_by(self, subscription: Subscription) -> bool:
        if subscription.status != SubscriptionStatus.TRIAL:
            return False
        
        if not subscription.trial_end_date:
            return False
        
        days_until_expiry = (subscription.trial_end_date - datetime.utcnow()).days
        return 0 <= days_until_expiry <= self.days


class PastDueSubscriptionSpecification(Specification):
    """Specification for past due subscriptions"""
    
    def is_satisfied_by(self, subscription: Subscription) -> bool:
        return subscription.is_past_due()
