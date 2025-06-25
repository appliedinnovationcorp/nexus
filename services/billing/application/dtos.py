"""
Billing & Subscription DTOs (Data Transfer Objects)
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field
from ..domain.models import (
    Invoice, Subscription, LineItem, Money, BillingAddress, 
    InvoiceStatus, SubscriptionStatus, PaymentMethod, SubscriptionPlan
)


class LineItemRequest(BaseModel):
    """Request DTO for line item"""
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(default=Decimal('1'), gt=0)
    unit_price: Money
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_percentage: Optional[Decimal] = Field(None, ge=0, le=100)


class BillingAddressRequest(BaseModel):
    """Request DTO for billing address"""
    company_name: Optional[str] = None
    street_address: str
    city: str
    state_province: str
    postal_code: str
    country: str
    tax_id: Optional[str] = None
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_jurisdiction: Optional[str] = None
    tax_exempt: bool = False


class CreateInvoiceRequest(BaseModel):
    """Request DTO for creating an invoice"""
    client_id: str
    project_id: Optional[str] = None
    subscription_id: Optional[str] = None
    line_items: List[LineItemRequest]
    due_date: Optional[datetime] = None
    billing_address: Optional[BillingAddressRequest] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    billing_period_start: Optional[datetime] = None
    billing_period_end: Optional[datetime] = None


class UpdateInvoiceRequest(BaseModel):
    """Request DTO for updating an invoice"""
    line_items: Optional[List[LineItemRequest]] = None
    due_date: Optional[datetime] = None
    billing_address: Optional[BillingAddressRequest] = None
    notes: Optional[str] = None
    terms: Optional[str] = None


class PaymentRequest(BaseModel):
    """Request DTO for processing payment"""
    payment_amount: Money
    payment_method: PaymentMethod
    payment_date: Optional[datetime] = None
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    processor: Optional[str] = None
    processor_fee: Optional[Money] = None
    metadata: Optional[Dict[str, Any]] = None


class LineItemResponse(BaseModel):
    """Response DTO for line item"""
    description: str
    quantity: Decimal
    unit_price: Money
    discount_percentage: Decimal
    tax_percentage: Decimal
    subtotal: Money
    discount_amount: Money
    taxable_amount: Money
    tax_amount: Money
    total: Money
    
    @classmethod
    def from_domain(cls, line_item: LineItem) -> 'LineItemResponse':
        """Convert domain model to response DTO"""
        return cls(
            description=line_item.description,
            quantity=line_item.quantity,
            unit_price=line_item.unit_price,
            discount_percentage=line_item.discount_percentage,
            tax_percentage=line_item.tax_percentage,
            subtotal=line_item.subtotal,
            discount_amount=line_item.discount_amount,
            taxable_amount=line_item.taxable_amount,
            tax_amount=line_item.tax_amount,
            total=line_item.total
        )


class InvoiceResponse(BaseModel):
    """Response DTO for invoice"""
    id: str
    invoice_number: str
    client_id: str
    project_id: Optional[str] = None
    subscription_id: Optional[str] = None
    status: InvoiceStatus
    issue_date: datetime
    due_date: datetime
    line_items: List[LineItemResponse]
    billing_address: Optional[BillingAddressRequest] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    currency: str
    subtotal: Money
    total_discount: Money
    total_tax: Money
    total_amount: Money
    is_overdue: bool
    days_overdue: int
    created_at: datetime
    updated_at: datetime
    version: int
    
    @classmethod
    def from_domain(cls, invoice: Invoice) -> 'InvoiceResponse':
        """Convert domain model to response DTO"""
        billing_address = None
        if invoice.billing_address:
            billing_address = BillingAddressRequest(
                company_name=invoice.billing_address.company_name,
                street_address=invoice.billing_address.street_address,
                city=invoice.billing_address.city,
                state_province=invoice.billing_address.state_province,
                postal_code=invoice.billing_address.postal_code,
                country=invoice.billing_address.country,
                tax_id=invoice.billing_address.tax_info.tax_id if invoice.billing_address.tax_info else None,
                tax_rate=invoice.billing_address.tax_info.tax_rate if invoice.billing_address.tax_info else None,
                tax_jurisdiction=invoice.billing_address.tax_info.tax_jurisdiction if invoice.billing_address.tax_info else None,
                tax_exempt=invoice.billing_address.tax_info.tax_exempt if invoice.billing_address.tax_info else False
            )
        
        return cls(
            id=invoice.id,
            invoice_number=invoice.invoice_number,
            client_id=invoice.client_id,
            project_id=invoice.project_id,
            subscription_id=invoice.subscription_id,
            status=invoice.status,
            issue_date=invoice.issue_date,
            due_date=invoice.due_date,
            line_items=[LineItemResponse.from_domain(item) for item in invoice.line_items],
            billing_address=billing_address,
            notes=invoice.notes,
            terms=invoice.terms,
            currency=invoice.currency,
            subtotal=invoice.subtotal,
            total_discount=invoice.total_discount,
            total_tax=invoice.total_tax,
            total_amount=invoice.total_amount,
            is_overdue=invoice.is_overdue(),
            days_overdue=invoice.days_overdue(),
            created_at=invoice.created_at,
            updated_at=invoice.updated_at,
            version=invoice.version
        )


class CreateSubscriptionRequest(BaseModel):
    """Request DTO for creating a subscription"""
    client_id: str
    plan: SubscriptionPlan
    quantity: Optional[int] = 1
    start_date: Optional[datetime] = None
    custom_pricing: Optional[Money] = None
    billing_address: Optional[BillingAddressRequest] = None


class UpdateSubscriptionRequest(BaseModel):
    """Request DTO for updating a subscription"""
    quantity: Optional[int] = None
    new_plan: Optional[SubscriptionPlan] = None
    prorate_change: Optional[bool] = True
    custom_pricing: Optional[Money] = None
    billing_address: Optional[BillingAddressRequest] = None


class SubscriptionResponse(BaseModel):
    """Response DTO for subscription"""
    id: str
    client_id: str
    plan: SubscriptionPlan
    status: SubscriptionStatus
    start_date: datetime
    end_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    next_billing_date: datetime
    quantity: int
    custom_pricing: Optional[Money] = None
    usage_tracking: Dict[str, int]
    billing_address: Optional[BillingAddressRequest] = None
    current_amount: Money
    is_trial_expired: bool
    is_past_due: bool
    days_until_renewal: int
    created_at: datetime
    updated_at: datetime
    version: int
    
    @classmethod
    def from_domain(cls, subscription: Subscription) -> 'SubscriptionResponse':
        """Convert domain model to response DTO"""
        billing_address = None
        if subscription.billing_address:
            billing_address = BillingAddressRequest(
                company_name=subscription.billing_address.company_name,
                street_address=subscription.billing_address.street_address,
                city=subscription.billing_address.city,
                state_province=subscription.billing_address.state_province,
                postal_code=subscription.billing_address.postal_code,
                country=subscription.billing_address.country,
                tax_id=subscription.billing_address.tax_info.tax_id if subscription.billing_address.tax_info else None,
                tax_rate=subscription.billing_address.tax_info.tax_rate if subscription.billing_address.tax_info else None,
                tax_jurisdiction=subscription.billing_address.tax_info.tax_jurisdiction if subscription.billing_address.tax_info else None,
                tax_exempt=subscription.billing_address.tax_info.tax_exempt if subscription.billing_address.tax_info else False
            )
        
        return cls(
            id=subscription.id,
            client_id=subscription.client_id,
            plan=subscription.plan,
            status=subscription.status,
            start_date=subscription.start_date,
            end_date=subscription.end_date,
            trial_end_date=subscription.trial_end_date,
            next_billing_date=subscription.next_billing_date,
            quantity=subscription.quantity,
            custom_pricing=subscription.custom_pricing,
            usage_tracking=subscription.usage_tracking,
            billing_address=billing_address,
            current_amount=subscription.calculate_current_amount(),
            is_trial_expired=subscription.is_trial_expired(),
            is_past_due=subscription.is_past_due(),
            days_until_renewal=subscription.days_until_renewal(),
            created_at=subscription.created_at,
            updated_at=subscription.updated_at,
            version=subscription.version
        )


class BillingSearchRequest(BaseModel):
    """Request DTO for searching billing records"""
    query: str = ""
    client_id: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    invoice_type: Optional[str] = None  # subscription, project, one_time
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    pagination: Optional[Dict[str, int]] = None


class RevenueReportResponse(BaseModel):
    """Response DTO for revenue report"""
    period_start: datetime
    period_end: datetime
    total_revenue: float
    invoice_count: int
    average_invoice_value: float
    revenue_by_service: Dict[str, float]
    monthly_recurring_revenue: Dict[str, float]
    subscription_statistics: Dict[str, Any]


class BillingAnalyticsResponse(BaseModel):
    """Response DTO for billing analytics"""
    total_revenue_ytd: float
    total_revenue_mtd: float
    mrr: float
    arr: float
    active_subscriptions: int
    trial_subscriptions: int
    churn_rate: float
    average_revenue_per_user: float
    revenue_growth_rate: float
    top_clients_by_revenue: List[Dict[str, Any]]
    revenue_by_plan: Dict[str, float]


class UsageTrackingRequest(BaseModel):
    """Request DTO for usage tracking"""
    subscription_id: str
    usage_type: str
    amount: int
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class BulkInvoiceRequest(BaseModel):
    """Request DTO for bulk invoice operations"""
    invoice_ids: List[str]
    action: str = Field(..., regex="^(send|cancel|mark_paid)$")
    reason: Optional[str] = None
    payment_details: Optional[PaymentRequest] = None


class BulkInvoiceResponse(BaseModel):
    """Response DTO for bulk invoice operations"""
    processed_count: int
    failed_count: int
    success_ids: List[str]
    failed_operations: List[Dict[str, str]]  # invoice_id -> error_message


class InvoiceTemplateRequest(BaseModel):
    """Request DTO for invoice template"""
    template_name: str
    client_id: str
    line_items: List[LineItemRequest]
    billing_cycle: Optional[str] = None
    auto_send: bool = False


class PaymentPlanRequest(BaseModel):
    """Request DTO for payment plan setup"""
    invoice_id: str
    number_of_payments: int = Field(..., ge=2, le=12)
    first_payment_date: datetime
    payment_frequency: str = Field(..., regex="^(weekly|monthly)$")


class RefundRequest(BaseModel):
    """Request DTO for processing refund"""
    invoice_id: str
    refund_amount: Money
    reason: str
    refund_method: Optional[str] = None
    partial_refund: bool = False


class TaxCalculationRequest(BaseModel):
    """Request DTO for tax calculation"""
    amount: Money
    client_address: BillingAddressRequest
    service_type: str
    tax_jurisdiction: Optional[str] = None


class TaxCalculationResponse(BaseModel):
    """Response DTO for tax calculation"""
    taxable_amount: Money
    tax_amount: Money
    tax_rate: Decimal
    tax_jurisdiction: str
    tax_breakdown: List[Dict[str, Any]]
