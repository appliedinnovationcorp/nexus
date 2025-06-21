"""
Billing & Subscription Application Services
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from shared.domain import ApplicationService, PaginationRequest, PaginationResponse
from shared.event_bus import publish_event
from ..domain.models import Invoice, Subscription, LineItem, Money, PaymentDetails, BillingAddress
from ..domain.repositories import InvoiceRepository, SubscriptionRepository
from ..domain.services import (
    InvoiceGenerationService, BillingCalculationService, 
    SubscriptionLifecycleService, RevenueAnalyticsService
)
from .dtos import (
    CreateInvoiceRequest, UpdateInvoiceRequest, InvoiceResponse,
    CreateSubscriptionRequest, UpdateSubscriptionRequest, SubscriptionResponse,
    PaymentRequest, BillingSearchRequest, RevenueReportResponse
)


class BillingService(ApplicationService):
    """Application service for billing operations"""
    
    def __init__(
        self,
        invoice_repository: InvoiceRepository,
        subscription_repository: SubscriptionRepository,
        invoice_generation_service: InvoiceGenerationService,
        billing_calculation_service: BillingCalculationService,
        lifecycle_service: SubscriptionLifecycleService,
        analytics_service: RevenueAnalyticsService
    ):
        self.invoice_repository = invoice_repository
        self.subscription_repository = subscription_repository
        self.invoice_generation_service = invoice_generation_service
        self.billing_calculation_service = billing_calculation_service
        self.lifecycle_service = lifecycle_service
        self.analytics_service = analytics_service
    
    async def create_invoice(self, request: CreateInvoiceRequest) -> InvoiceResponse:
        """Create a new invoice"""
        # Convert line items
        line_items = [
            LineItem(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percentage=item.discount_percentage or 0,
                tax_percentage=item.tax_percentage or 0
            )
            for item in request.line_items
        ]
        
        # Create billing address if provided
        billing_address = None
        if request.billing_address:
            billing_address = BillingAddress(**request.billing_address.dict())
        
        # Generate invoice
        if request.subscription_id:
            # This would typically be called automatically by billing cycle
            subscription = await self.subscription_repository.get_by_id(request.subscription_id)
            if not subscription:
                raise ValueError(f"Subscription {request.subscription_id} not found")
            
            invoice = await self.invoice_generation_service.generate_subscription_invoice(
                subscription=subscription,
                billing_period_start=request.billing_period_start or datetime.utcnow(),
                billing_period_end=request.billing_period_end or datetime.utcnow() + timedelta(days=30)
            )
        else:
            # Manual invoice creation
            invoice = await self.invoice_generation_service.generate_project_invoice(
                client_id=request.client_id,
                project_id=request.project_id,
                line_items=line_items,
                due_date=request.due_date,
                billing_address=billing_address
            )
        
        # Add notes and terms
        if request.notes:
            invoice.notes = request.notes
        if request.terms:
            invoice.terms = request.terms
        
        # Save invoice
        saved_invoice = await self.invoice_repository.save(invoice)
        
        # Publish domain events
        for event in saved_invoice.domain_events:
            await publish_event(event)
        saved_invoice.clear_domain_events()
        
        return InvoiceResponse.from_domain(saved_invoice)
    
    async def get_invoice(self, invoice_id: str) -> Optional[InvoiceResponse]:
        """Get invoice by ID"""
        invoice = await self.invoice_repository.get_by_id(invoice_id)
        return InvoiceResponse.from_domain(invoice) if invoice else None
    
    async def get_invoice_by_number(self, invoice_number: str) -> Optional[InvoiceResponse]:
        """Get invoice by invoice number"""
        invoice = await self.invoice_repository.find_by_invoice_number(invoice_number)
        return InvoiceResponse.from_domain(invoice) if invoice else None
    
    async def update_invoice(self, invoice_id: str, request: UpdateInvoiceRequest) -> InvoiceResponse:
        """Update invoice information"""
        invoice = await self.invoice_repository.get_by_id(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        # Update line items if provided
        if request.line_items is not None:
            # Clear existing line items and add new ones
            invoice.line_items.clear()
            for item_request in request.line_items:
                line_item = LineItem(
                    description=item_request.description,
                    quantity=item_request.quantity,
                    unit_price=item_request.unit_price,
                    discount_percentage=item_request.discount_percentage or 0,
                    tax_percentage=item_request.tax_percentage or 0
                )
                invoice.add_line_item(line_item)
        
        # Update other fields
        if request.due_date is not None:
            invoice.due_date = request.due_date
        if request.notes is not None:
            invoice.notes = request.notes
        if request.terms is not None:
            invoice.terms = request.terms
        if request.billing_address is not None:
            invoice.billing_address = BillingAddress(**request.billing_address.dict())
        
        invoice.updated_at = datetime.utcnow()
        invoice.version += 1
        
        # Save invoice
        saved_invoice = await self.invoice_repository.save(invoice)
        
        return InvoiceResponse.from_domain(saved_invoice)
    
    async def send_invoice(self, invoice_id: str) -> InvoiceResponse:
        """Send invoice to client"""
        invoice = await self.invoice_repository.get_by_id(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        invoice.send_invoice()
        saved_invoice = await self.invoice_repository.save(invoice)
        
        # TODO: Integrate with email service to actually send invoice
        
        return InvoiceResponse.from_domain(saved_invoice)
    
    async def process_payment(self, invoice_id: str, request: PaymentRequest) -> InvoiceResponse:
        """Process payment for invoice"""
        invoice = await self.invoice_repository.get_by_id(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        payment_details = PaymentDetails(
            payment_method=request.payment_method,
            transaction_id=request.transaction_id,
            reference_number=request.reference_number,
            processor=request.processor,
            processor_fee=request.processor_fee,
            metadata=request.metadata or {}
        )
        
        invoice.mark_paid(
            payment_amount=request.payment_amount,
            payment_date=request.payment_date or datetime.utcnow(),
            payment_details=payment_details
        )
        
        saved_invoice = await self.invoice_repository.save(invoice)
        
        # Publish domain events
        for event in saved_invoice.domain_events:
            await publish_event(event)
        saved_invoice.clear_domain_events()
        
        return InvoiceResponse.from_domain(saved_invoice)
    
    async def cancel_invoice(self, invoice_id: str, reason: str = None) -> InvoiceResponse:
        """Cancel invoice"""
        invoice = await self.invoice_repository.get_by_id(invoice_id)
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        invoice.cancel_invoice(reason)
        saved_invoice = await self.invoice_repository.save(invoice)
        
        return InvoiceResponse.from_domain(saved_invoice)
    
    async def get_invoices_by_client(self, client_id: str) -> List[InvoiceResponse]:
        """Get all invoices for a client"""
        invoices = await self.invoice_repository.find_by_client_id(client_id)
        return [InvoiceResponse.from_domain(invoice) for invoice in invoices]
    
    async def get_overdue_invoices(self) -> List[InvoiceResponse]:
        """Get all overdue invoices"""
        invoices = await self.invoice_repository.find_overdue_invoices()
        return [InvoiceResponse.from_domain(invoice) for invoice in invoices]
    
    async def create_subscription(self, request: CreateSubscriptionRequest) -> SubscriptionResponse:
        """Create a new subscription"""
        # Create subscription
        subscription = Subscription.create(
            client_id=request.client_id,
            plan=request.plan,
            quantity=request.quantity or 1,
            start_date=request.start_date,
            billing_address=BillingAddress(**request.billing_address.dict()) if request.billing_address else None
        )
        
        # Set custom pricing if provided
        if request.custom_pricing:
            subscription.custom_pricing = request.custom_pricing
        
        # Save subscription
        saved_subscription = await self.subscription_repository.save(subscription)
        
        # Publish domain events
        for event in saved_subscription.domain_events:
            await publish_event(event)
        saved_subscription.clear_domain_events()
        
        return SubscriptionResponse.from_domain(saved_subscription)
    
    async def get_subscription(self, subscription_id: str) -> Optional[SubscriptionResponse]:
        """Get subscription by ID"""
        subscription = await self.subscription_repository.get_by_id(subscription_id)
        return SubscriptionResponse.from_domain(subscription) if subscription else None
    
    async def update_subscription(self, subscription_id: str, request: UpdateSubscriptionRequest) -> SubscriptionResponse:
        """Update subscription"""
        subscription = await self.subscription_repository.get_by_id(subscription_id)
        if not subscription:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        # Update quantity
        if request.quantity is not None:
            subscription.quantity = request.quantity
        
        # Change plan
        if request.new_plan is not None:
            subscription.change_plan(request.new_plan, request.prorate_change or True)
        
        # Update custom pricing
        if request.custom_pricing is not None:
            subscription.custom_pricing = request.custom_pricing
        
        # Update billing address
        if request.billing_address is not None:
            subscription.billing_address = BillingAddress(**request.billing_address.dict())
        
        subscription.updated_at = datetime.utcnow()
        subscription.version += 1
        
        # Save subscription
        saved_subscription = await self.subscription_repository.save(subscription)
        
        return SubscriptionResponse.from_domain(saved_subscription)
    
    async def cancel_subscription(self, subscription_id: str, end_date: datetime = None) -> SubscriptionResponse:
        """Cancel subscription"""
        subscription = await self.subscription_repository.get_by_id(subscription_id)
        if not subscription:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        subscription.cancel(end_date)
        saved_subscription = await self.subscription_repository.save(subscription)
        
        return SubscriptionResponse.from_domain(saved_subscription)
    
    async def activate_subscription(self, subscription_id: str) -> SubscriptionResponse:
        """Activate trial subscription"""
        subscription = await self.subscription_repository.get_by_id(subscription_id)
        if not subscription:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        subscription.activate()
        saved_subscription = await self.subscription_repository.save(subscription)
        
        return SubscriptionResponse.from_domain(saved_subscription)
    
    async def update_usage(self, subscription_id: str, usage_type: str, amount: int) -> SubscriptionResponse:
        """Update subscription usage tracking"""
        subscription = await self.subscription_repository.get_by_id(subscription_id)
        if not subscription:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        subscription.update_usage(usage_type, amount)
        saved_subscription = await self.subscription_repository.save(subscription)
        
        return SubscriptionResponse.from_domain(saved_subscription)
    
    async def get_subscriptions_by_client(self, client_id: str) -> List[SubscriptionResponse]:
        """Get all subscriptions for a client"""
        subscriptions = await self.subscription_repository.find_by_client_id(client_id)
        return [SubscriptionResponse.from_domain(subscription) for subscription in subscriptions]
    
    async def process_billing_cycle(self) -> Dict[str, Any]:
        """Process billing cycle for all due subscriptions"""
        # Get subscriptions due for billing
        due_subscriptions = await self.subscription_repository.find_due_for_billing()
        
        results = {
            'processed_count': 0,
            'failed_count': 0,
            'generated_invoices': [],
            'errors': []
        }
        
        for subscription in due_subscriptions:
            try:
                # Generate invoice for subscription
                billing_start = subscription.next_billing_date - timedelta(days=30)  # Simplified
                billing_end = subscription.next_billing_date
                
                invoice = await self.invoice_generation_service.generate_subscription_invoice(
                    subscription=subscription,
                    billing_period_start=billing_start,
                    billing_period_end=billing_end
                )
                
                # Save invoice
                saved_invoice = await self.invoice_repository.save(invoice)
                
                # Update subscription billing date
                await self.lifecycle_service.process_billing_renewals()
                
                results['generated_invoices'].append(saved_invoice.id)
                results['processed_count'] += 1
                
            except Exception as e:
                results['failed_count'] += 1
                results['errors'].append({
                    'subscription_id': subscription.id,
                    'error': str(e)
                })
        
        return results
    
    async def process_trial_expirations(self) -> Dict[str, Any]:
        """Process expired trial subscriptions"""
        processed_ids = await self.lifecycle_service.process_trial_expirations()
        
        return {
            'processed_count': len(processed_ids),
            'processed_subscriptions': processed_ids
        }
    
    async def get_revenue_report(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> RevenueReportResponse:
        """Get comprehensive revenue report"""
        
        # Get revenue metrics
        metrics = await self.analytics_service.calculate_revenue_metrics(start_date, end_date)
        
        # Get MRR
        mrr = await self.analytics_service.calculate_monthly_recurring_revenue()
        
        # Get subscription statistics
        subscription_stats = await self.subscription_repository.get_subscription_statistics()
        
        return RevenueReportResponse(
            period_start=start_date,
            period_end=end_date,
            total_revenue=metrics['total_revenue'],
            invoice_count=metrics['invoice_count'],
            average_invoice_value=metrics['average_invoice_value'],
            revenue_by_service=metrics['revenue_by_service'],
            monthly_recurring_revenue=mrr,
            subscription_statistics=subscription_stats
        )
    
    async def get_billing_dashboard(self, client_id: str = None) -> Dict[str, Any]:
        """Get billing dashboard data"""
        
        # Get overdue invoices
        overdue_invoices = await self.invoice_repository.find_overdue_invoices()
        if client_id:
            overdue_invoices = [inv for inv in overdue_invoices if inv.client_id == client_id]
        
        # Get invoices due soon
        due_soon_invoices = await self.invoice_repository.find_invoices_due_soon(days=7)
        if client_id:
            due_soon_invoices = [inv for inv in due_soon_invoices if inv.client_id == client_id]
        
        # Get active subscriptions
        if client_id:
            active_subscriptions = await self.subscription_repository.find_by_client_id(client_id)
            active_subscriptions = [sub for sub in active_subscriptions if sub.status.value == 'Active']
        else:
            active_subscriptions = await self.subscription_repository.find_active_subscriptions()
        
        # Get expiring trials
        expiring_trials = await self.subscription_repository.find_expiring_trials(days=7)
        if client_id:
            expiring_trials = [sub for sub in expiring_trials if sub.client_id == client_id]
        
        return {
            'overdue_invoices': {
                'count': len(overdue_invoices),
                'total_amount': sum(inv.total_amount.amount for inv in overdue_invoices),
                'invoices': [InvoiceResponse.from_domain(inv) for inv in overdue_invoices[:10]]
            },
            'due_soon_invoices': {
                'count': len(due_soon_invoices),
                'total_amount': sum(inv.total_amount.amount for inv in due_soon_invoices),
                'invoices': [InvoiceResponse.from_domain(inv) for inv in due_soon_invoices[:10]]
            },
            'active_subscriptions': {
                'count': len(active_subscriptions),
                'total_mrr': sum(
                    self.analytics_service._normalize_to_monthly(
                        sub.calculate_current_amount(), 
                        sub.plan.billing_cycle
                    ) for sub in active_subscriptions
                ),
                'subscriptions': [SubscriptionResponse.from_domain(sub) for sub in active_subscriptions[:10]]
            },
            'expiring_trials': {
                'count': len(expiring_trials),
                'trials': [SubscriptionResponse.from_domain(sub) for sub in expiring_trials[:10]]
            }
        }
