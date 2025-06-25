"""
Billing & Subscription Domain Models
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import Field, validator
from enum import Enum
from decimal import Decimal
from shared.domain import AggregateRoot, ValueObject, Money
from shared.events import InvoiceCreated, InvoicePaid, SubscriptionCreated


class BillingCycle(str, Enum):
    """Billing cycle options"""
    MONTHLY = "Monthly"
    QUARTERLY = "Quarterly"
    ANNUALLY = "Annually"
    ONE_TIME = "One_Time"


class InvoiceStatus(str, Enum):
    """Invoice status enumeration"""
    DRAFT = "Draft"
    PENDING = "Pending"
    SENT = "Sent"
    PAID = "Paid"
    OVERDUE = "Overdue"
    CANCELLED = "Cancelled"
    REFUNDED = "Refunded"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"
    REFUNDED = "Refunded"


class PaymentMethod(str, Enum):
    """Payment method types"""
    CREDIT_CARD = "Credit_Card"
    BANK_TRANSFER = "Bank_Transfer"
    ACH = "ACH"
    WIRE = "Wire"
    CHECK = "Check"
    CRYPTO = "Crypto"


class SubscriptionStatus(str, Enum):
    """Subscription status enumeration"""
    ACTIVE = "Active"
    TRIAL = "Trial"
    PAST_DUE = "Past_Due"
    CANCELLED = "Cancelled"
    EXPIRED = "Expired"
    SUSPENDED = "Suspended"


class PricingModel(str, Enum):
    """Pricing model types"""
    FIXED = "Fixed"
    USAGE_BASED = "Usage_Based"
    TIERED = "Tiered"
    PER_SEAT = "Per_Seat"
    HYBRID = "Hybrid"


class LineItem(ValueObject):
    """Invoice line item"""
    description: str
    quantity: Decimal = Field(default=Decimal('1'))
    unit_price: Money
    discount_percentage: Decimal = Field(default=Decimal('0'), ge=0, le=100)
    tax_percentage: Decimal = Field(default=Decimal('0'), ge=0, le=100)
    
    @property
    def subtotal(self) -> Money:
        """Calculate subtotal before discount and tax"""
        return Money(
            amount=float(self.quantity * Decimal(str(self.unit_price.amount))),
            currency=self.unit_price.currency
        )
    
    @property
    def discount_amount(self) -> Money:
        """Calculate discount amount"""
        discount = self.subtotal.amount * float(self.discount_percentage) / 100
        return Money(amount=discount, currency=self.unit_price.currency)
    
    @property
    def taxable_amount(self) -> Money:
        """Calculate amount after discount, before tax"""
        return Money(
            amount=self.subtotal.amount - self.discount_amount.amount,
            currency=self.unit_price.currency
        )
    
    @property
    def tax_amount(self) -> Money:
        """Calculate tax amount"""
        tax = self.taxable_amount.amount * float(self.tax_percentage) / 100
        return Money(amount=tax, currency=self.unit_price.currency)
    
    @property
    def total(self) -> Money:
        """Calculate total amount including tax"""
        return Money(
            amount=self.taxable_amount.amount + self.tax_amount.amount,
            currency=self.unit_price.currency
        )


class PaymentDetails(ValueObject):
    """Payment transaction details"""
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    processor: Optional[str] = None  # Stripe, PayPal, etc.
    processor_fee: Optional[Money] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TaxInfo(ValueObject):
    """Tax information"""
    tax_id: Optional[str] = None
    tax_rate: Decimal = Field(default=Decimal('0'))
    tax_jurisdiction: Optional[str] = None
    tax_exempt: bool = False
    exemption_certificate: Optional[str] = None


class BillingAddress(ValueObject):
    """Billing address information"""
    company_name: Optional[str] = None
    street_address: str
    city: str
    state_province: str
    postal_code: str
    country: str
    tax_info: Optional[TaxInfo] = None


class Invoice(AggregateRoot):
    """Invoice aggregate root"""
    invoice_number: str
    client_id: str
    project_id: Optional[str] = None
    subscription_id: Optional[str] = None
    status: InvoiceStatus = InvoiceStatus.DRAFT
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime
    line_items: List[LineItem] = Field(default_factory=list)
    billing_address: Optional[BillingAddress] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    currency: str = "USD"
    
    @validator('due_date')
    def validate_due_date(cls, v, values):
        if 'issue_date' in values and v < values['issue_date']:
            raise ValueError('Due date cannot be before issue date')
        return v
    
    @classmethod
    def create(
        cls,
        invoice_number: str,
        client_id: str,
        due_date: datetime,
        line_items: List[LineItem],
        project_id: str = None,
        subscription_id: str = None,
        billing_address: BillingAddress = None
    ) -> 'Invoice':
        """Factory method to create a new invoice"""
        invoice = cls(
            invoice_number=invoice_number,
            client_id=client_id,
            project_id=project_id,
            subscription_id=subscription_id,
            due_date=due_date,
            line_items=line_items,
            billing_address=billing_address
        )
        
        # Add domain event
        invoice.add_domain_event(InvoiceCreated(
            aggregate_id=invoice.id,
            client_id=client_id,
            project_id=project_id,
            amount=invoice.total_amount.amount,
            currency=invoice.currency,
            due_date=due_date
        ))
        
        return invoice
    
    @property
    def subtotal(self) -> Money:
        """Calculate subtotal of all line items"""
        if not self.line_items:
            return Money(amount=0.0, currency=self.currency)
        
        total = sum(item.subtotal.amount for item in self.line_items)
        return Money(amount=total, currency=self.currency)
    
    @property
    def total_discount(self) -> Money:
        """Calculate total discount amount"""
        if not self.line_items:
            return Money(amount=0.0, currency=self.currency)
        
        total = sum(item.discount_amount.amount for item in self.line_items)
        return Money(amount=total, currency=self.currency)
    
    @property
    def total_tax(self) -> Money:
        """Calculate total tax amount"""
        if not self.line_items:
            return Money(amount=0.0, currency=self.currency)
        
        total = sum(item.tax_amount.amount for item in self.line_items)
        return Money(amount=total, currency=self.currency)
    
    @property
    def total_amount(self) -> Money:
        """Calculate total invoice amount"""
        if not self.line_items:
            return Money(amount=0.0, currency=self.currency)
        
        total = sum(item.total.amount for item in self.line_items)
        return Money(amount=total, currency=self.currency)
    
    def add_line_item(self, line_item: LineItem):
        """Add line item to invoice"""
        if self.status != InvoiceStatus.DRAFT:
            raise ValueError("Cannot modify invoice that is not in draft status")
        
        self.line_items.append(line_item)
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def remove_line_item(self, index: int):
        """Remove line item from invoice"""
        if self.status != InvoiceStatus.DRAFT:
            raise ValueError("Cannot modify invoice that is not in draft status")
        
        if 0 <= index < len(self.line_items):
            self.line_items.pop(index)
            self.updated_at = datetime.utcnow()
            self.version += 1
    
    def send_invoice(self):
        """Mark invoice as sent"""
        if self.status != InvoiceStatus.DRAFT:
            raise ValueError("Can only send draft invoices")
        
        self.status = InvoiceStatus.SENT
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def mark_paid(self, payment_amount: Money, payment_date: datetime, payment_details: PaymentDetails):
        """Mark invoice as paid"""
        if self.status not in [InvoiceStatus.SENT, InvoiceStatus.OVERDUE]:
            raise ValueError("Can only mark sent or overdue invoices as paid")
        
        if payment_amount.currency != self.currency:
            raise ValueError("Payment currency must match invoice currency")
        
        self.status = InvoiceStatus.PAID
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(InvoicePaid(
            aggregate_id=self.id,
            payment_amount=payment_amount.amount,
            payment_date=payment_date,
            payment_method=payment_details.payment_method.value
        ))
    
    def cancel_invoice(self, reason: str = None):
        """Cancel invoice"""
        if self.status == InvoiceStatus.PAID:
            raise ValueError("Cannot cancel paid invoice")
        
        self.status = InvoiceStatus.CANCELLED
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        if reason:
            self.notes = f"{self.notes or ''}\nCancelled: {reason}".strip()
    
    def is_overdue(self) -> bool:
        """Check if invoice is overdue"""
        return (self.status in [InvoiceStatus.SENT, InvoiceStatus.PENDING] and 
                self.due_date < datetime.utcnow())
    
    def days_overdue(self) -> int:
        """Calculate days overdue"""
        if not self.is_overdue():
            return 0
        return (datetime.utcnow() - self.due_date).days


class PricingTier(ValueObject):
    """Pricing tier for tiered pricing models"""
    min_quantity: int
    max_quantity: Optional[int] = None  # None means unlimited
    unit_price: Money
    
    def applies_to_quantity(self, quantity: int) -> bool:
        """Check if this tier applies to the given quantity"""
        if quantity < self.min_quantity:
            return False
        if self.max_quantity is not None and quantity > self.max_quantity:
            return False
        return True


class SubscriptionPlan(ValueObject):
    """Subscription plan definition"""
    plan_id: str
    name: str
    description: Optional[str] = None
    pricing_model: PricingModel
    base_price: Money
    billing_cycle: BillingCycle
    trial_period_days: int = 0
    setup_fee: Optional[Money] = None
    pricing_tiers: List[PricingTier] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    usage_limits: Dict[str, int] = Field(default_factory=dict)  # e.g., {"api_calls": 10000}
    is_active: bool = True
    
    def calculate_price(self, quantity: int = 1, usage: Dict[str, int] = None) -> Money:
        """Calculate price based on quantity and usage"""
        if self.pricing_model == PricingModel.FIXED:
            return self.base_price
        
        elif self.pricing_model == PricingModel.PER_SEAT:
            return Money(
                amount=self.base_price.amount * quantity,
                currency=self.base_price.currency
            )
        
        elif self.pricing_model == PricingModel.TIERED:
            # Find applicable tier
            for tier in self.pricing_tiers:
                if tier.applies_to_quantity(quantity):
                    return Money(
                        amount=tier.unit_price.amount * quantity,
                        currency=tier.unit_price.currency
                    )
            return self.base_price
        
        elif self.pricing_model == PricingModel.USAGE_BASED:
            # Simplified usage-based pricing
            if usage:
                total_usage = sum(usage.values())
                return Money(
                    amount=self.base_price.amount * total_usage,
                    currency=self.base_price.currency
                )
            return Money(amount=0.0, currency=self.base_price.currency)
        
        else:  # HYBRID or other
            return self.base_price


class Subscription(AggregateRoot):
    """Subscription aggregate root"""
    client_id: str
    plan: SubscriptionPlan
    status: SubscriptionStatus = SubscriptionStatus.TRIAL
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    next_billing_date: datetime
    quantity: int = 1
    custom_pricing: Optional[Money] = None
    usage_tracking: Dict[str, int] = Field(default_factory=dict)
    billing_address: Optional[BillingAddress] = None
    
    @classmethod
    def create(
        cls,
        client_id: str,
        plan: SubscriptionPlan,
        quantity: int = 1,
        start_date: datetime = None,
        billing_address: BillingAddress = None
    ) -> 'Subscription':
        """Factory method to create a new subscription"""
        start_date = start_date or datetime.utcnow()
        
        # Calculate trial end date
        trial_end_date = None
        if plan.trial_period_days > 0:
            trial_end_date = start_date + timedelta(days=plan.trial_period_days)
        
        # Calculate next billing date
        next_billing_date = cls._calculate_next_billing_date(start_date, plan.billing_cycle)
        if trial_end_date and trial_end_date > next_billing_date:
            next_billing_date = trial_end_date
        
        subscription = cls(
            client_id=client_id,
            plan=plan,
            start_date=start_date,
            trial_end_date=trial_end_date,
            next_billing_date=next_billing_date,
            quantity=quantity,
            billing_address=billing_address
        )
        
        # Add domain event
        subscription.add_domain_event(SubscriptionCreated(
            aggregate_id=subscription.id,
            client_id=client_id,
            plan_type=plan.name,
            monthly_amount=subscription.calculate_current_amount().amount
        ))
        
        return subscription
    
    @staticmethod
    def _calculate_next_billing_date(start_date: datetime, billing_cycle: BillingCycle) -> datetime:
        """Calculate next billing date based on cycle"""
        if billing_cycle == BillingCycle.MONTHLY:
            return start_date + timedelta(days=30)
        elif billing_cycle == BillingCycle.QUARTERLY:
            return start_date + timedelta(days=90)
        elif billing_cycle == BillingCycle.ANNUALLY:
            return start_date + timedelta(days=365)
        else:  # ONE_TIME
            return start_date
    
    def calculate_current_amount(self) -> Money:
        """Calculate current billing amount"""
        if self.custom_pricing:
            return self.custom_pricing
        
        return self.plan.calculate_price(self.quantity, self.usage_tracking)
    
    def activate(self):
        """Activate subscription"""
        if self.status != SubscriptionStatus.TRIAL:
            raise ValueError("Can only activate trial subscriptions")
        
        self.status = SubscriptionStatus.ACTIVE
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def cancel(self, end_date: datetime = None):
        """Cancel subscription"""
        if self.status == SubscriptionStatus.CANCELLED:
            raise ValueError("Subscription is already cancelled")
        
        self.status = SubscriptionStatus.CANCELLED
        self.end_date = end_date or datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def suspend(self, reason: str = None):
        """Suspend subscription"""
        if self.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]:
            raise ValueError("Can only suspend active or past due subscriptions")
        
        self.status = SubscriptionStatus.SUSPENDED
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def update_usage(self, usage_type: str, amount: int):
        """Update usage tracking"""
        self.usage_tracking[usage_type] = self.usage_tracking.get(usage_type, 0) + amount
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def change_plan(self, new_plan: SubscriptionPlan, prorate: bool = True):
        """Change subscription plan"""
        if self.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]:
            raise ValueError("Can only change plan for active or trial subscriptions")
        
        old_plan = self.plan
        self.plan = new_plan
        
        # Recalculate next billing date if billing cycle changed
        if old_plan.billing_cycle != new_plan.billing_cycle:
            self.next_billing_date = self._calculate_next_billing_date(
                datetime.utcnow(), new_plan.billing_cycle
            )
        
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def is_trial_expired(self) -> bool:
        """Check if trial period has expired"""
        return (self.status == SubscriptionStatus.TRIAL and 
                self.trial_end_date and 
                self.trial_end_date < datetime.utcnow())
    
    def is_past_due(self) -> bool:
        """Check if subscription is past due"""
        return (self.status == SubscriptionStatus.ACTIVE and 
                self.next_billing_date < datetime.utcnow())
    
    def days_until_renewal(self) -> int:
        """Calculate days until next renewal"""
        if self.next_billing_date < datetime.utcnow():
            return 0
        return (self.next_billing_date - datetime.utcnow()).days
