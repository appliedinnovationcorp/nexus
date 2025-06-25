"""
Billing & Subscription Infrastructure - Repository Implementations
"""
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import asyncpg
import motor.motor_asyncio
from ..domain.models import (
    Invoice, Subscription, LineItem, Money, BillingAddress, TaxInfo,
    InvoiceStatus, SubscriptionStatus, PaymentDetails, SubscriptionPlan,
    BillingCycle, PricingModel, PricingTier
)
from ..domain.repositories import InvoiceRepository, SubscriptionRepository


class PostgreSQLInvoiceRepository(InvoiceRepository):
    """PostgreSQL implementation of InvoiceRepository (Write side - CQRS)"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
        await self._create_tables()
    
    async def _create_tables(self):
        """Create necessary tables"""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS invoices (
                    id VARCHAR(36) PRIMARY KEY,
                    invoice_number VARCHAR(50) UNIQUE NOT NULL,
                    client_id VARCHAR(36) NOT NULL,
                    project_id VARCHAR(36),
                    subscription_id VARCHAR(36),
                    status VARCHAR(20) NOT NULL DEFAULT 'Draft',
                    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    line_items JSONB NOT NULL DEFAULT '[]',
                    billing_address JSONB,
                    notes TEXT,
                    terms TEXT,
                    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
                CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
                CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
                CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
                CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
                CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
                
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id VARCHAR(36) PRIMARY KEY,
                    client_id VARCHAR(36) NOT NULL,
                    plan_data JSONB NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'Trial',
                    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    end_date TIMESTAMP WITH TIME ZONE,
                    trial_end_date TIMESTAMP WITH TIME ZONE,
                    next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    custom_pricing JSONB,
                    usage_tracking JSONB DEFAULT '{}',
                    billing_address JSONB,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id ON subscriptions(client_id);
                CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
                CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
                CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end_date);
            """)
    
    async def get_by_id(self, id: str) -> Optional[Invoice]:
        """Get invoice by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM invoices WHERE id = $1", id
            )
            return self._row_to_invoice(row) if row else None
    
    async def save(self, invoice: Invoice) -> Invoice:
        """Save invoice"""
        async with self.pool.acquire() as conn:
            # Check if invoice exists
            existing = await conn.fetchrow(
                "SELECT version FROM invoices WHERE id = $1", invoice.id
            )
            
            if existing:
                # Update existing invoice
                if existing['version'] != invoice.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE invoices SET
                        invoice_number = $2,
                        client_id = $3,
                        project_id = $4,
                        subscription_id = $5,
                        status = $6,
                        issue_date = $7,
                        due_date = $8,
                        line_items = $9,
                        billing_address = $10,
                        notes = $11,
                        terms = $12,
                        currency = $13,
                        updated_at = $14,
                        version = $15
                    WHERE id = $1
                """, 
                    invoice.id,
                    invoice.invoice_number,
                    invoice.client_id,
                    invoice.project_id,
                    invoice.subscription_id,
                    invoice.status.value,
                    invoice.issue_date,
                    invoice.due_date,
                    json.dumps([item.dict() for item in invoice.line_items]),
                    json.dumps(invoice.billing_address.dict()) if invoice.billing_address else None,
                    invoice.notes,
                    invoice.terms,
                    invoice.currency,
                    invoice.updated_at,
                    invoice.version
                )
            else:
                # Insert new invoice
                await conn.execute("""
                    INSERT INTO invoices (
                        id, invoice_number, client_id, project_id, subscription_id,
                        status, issue_date, due_date, line_items, billing_address,
                        notes, terms, currency, created_at, updated_at, version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                """,
                    invoice.id,
                    invoice.invoice_number,
                    invoice.client_id,
                    invoice.project_id,
                    invoice.subscription_id,
                    invoice.status.value,
                    invoice.issue_date,
                    invoice.due_date,
                    json.dumps([item.dict() for item in invoice.line_items]),
                    json.dumps(invoice.billing_address.dict()) if invoice.billing_address else None,
                    invoice.notes,
                    invoice.terms,
                    invoice.currency,
                    invoice.created_at,
                    invoice.updated_at,
                    invoice.version
                )
        
        return invoice
    
    async def delete(self, id: str) -> bool:
        """Delete invoice (soft delete by cancelling)"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE invoices SET status = 'Cancelled', updated_at = NOW() WHERE id = $1",
                id
            )
            return result == "UPDATE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[Invoice]:
        """Find all invoices"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_invoice(row) for row in rows]
    
    async def find_by_client_id(self, client_id: str) -> List[Invoice]:
        """Find invoices by client ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM invoices WHERE client_id = $1 ORDER BY created_at DESC",
                client_id
            )
            return [self._row_to_invoice(row) for row in rows]
    
    async def find_by_project_id(self, project_id: str) -> List[Invoice]:
        """Find invoices by project ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM invoices WHERE project_id = $1 ORDER BY created_at DESC",
                project_id
            )
            return [self._row_to_invoice(row) for row in rows]
    
    async def find_by_subscription_id(self, subscription_id: str) -> List[Invoice]:
        """Find invoices by subscription ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM invoices WHERE subscription_id = $1 ORDER BY created_at DESC",
                subscription_id
            )
            return [self._row_to_invoice(row) for row in rows]
    
    async def find_by_status(self, status: InvoiceStatus) -> List[Invoice]:
        """Find invoices by status"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM invoices WHERE status = $1 ORDER BY created_at DESC",
                status.value
            )
            return [self._row_to_invoice(row) for row in rows]
    
    async def find_by_invoice_number(self, invoice_number: str) -> Optional[Invoice]:
        """Find invoice by invoice number"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM invoices WHERE invoice_number = $1",
                invoice_number
            )
            return self._row_to_invoice(row) if row else None
    
    async def find_overdue_invoices(self) -> List[Invoice]:
        """Find overdue invoices"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM invoices 
                WHERE status IN ('Sent', 'Pending') 
                AND due_date < NOW()
                ORDER BY due_date ASC
            """)
            return [self._row_to_invoice(row) for row in rows]
    
    async def find_invoices_due_soon(self, days: int = 7) -> List[Invoice]:
        """Find invoices due within specified days"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM invoices 
                WHERE status IN ('Sent', 'Pending')
                AND due_date BETWEEN NOW() AND NOW() + INTERVAL '%s days'
                ORDER BY due_date ASC
            """ % days)
            return [self._row_to_invoice(row) for row in rows]
    
    async def find_by_date_range(
        self, 
        start_date: datetime, 
        end_date: datetime,
        client_id: Optional[str] = None
    ) -> List[Invoice]:
        """Find invoices within date range"""
        conditions = ["issue_date BETWEEN $1 AND $2"]
        params = [start_date, end_date]
        
        if client_id:
            conditions.append("client_id = $3")
            params.append(client_id)
        
        where_clause = " AND ".join(conditions)
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                f"SELECT * FROM invoices WHERE {where_clause} ORDER BY issue_date DESC",
                *params
            )
            return [self._row_to_invoice(row) for row in rows]
    
    async def get_revenue_statistics(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> dict:
        """Get revenue statistics for date range"""
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_invoices,
                    COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_invoices,
                    SUM(CASE WHEN status = 'Paid' THEN 
                        (SELECT SUM((item->>'total')::DECIMAL) FROM jsonb_array_elements(line_items) item)
                        ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = 'Paid' THEN 
                        (SELECT SUM((item->>'total')::DECIMAL) FROM jsonb_array_elements(line_items) item)
                        ELSE NULL END) as avg_invoice_value
                FROM invoices 
                WHERE issue_date BETWEEN $1 AND $2
            """, start_date, end_date)
            
            return {
                'total_invoices': stats['total_invoices'],
                'paid_invoices': stats['paid_invoices'],
                'total_revenue': float(stats['total_revenue']) if stats['total_revenue'] else 0,
                'average_invoice_value': float(stats['avg_invoice_value']) if stats['avg_invoice_value'] else 0
            }
    
    def _row_to_invoice(self, row) -> Invoice:
        """Convert database row to Invoice domain model"""
        if not row:
            return None
        
        # Parse line items
        line_items_data = json.loads(row['line_items']) if row['line_items'] else []
        line_items = []
        for item_data in line_items_data:
            line_items.append(LineItem(
                description=item_data['description'],
                quantity=Decimal(str(item_data['quantity'])),
                unit_price=Money(**item_data['unit_price']),
                discount_percentage=Decimal(str(item_data.get('discount_percentage', 0))),
                tax_percentage=Decimal(str(item_data.get('tax_percentage', 0)))
            ))
        
        # Parse billing address
        billing_address = None
        if row['billing_address']:
            addr_data = json.loads(row['billing_address'])
            tax_info = None
            if 'tax_info' in addr_data and addr_data['tax_info']:
                tax_info = TaxInfo(**addr_data['tax_info'])
            
            billing_address = BillingAddress(
                company_name=addr_data.get('company_name'),
                street_address=addr_data['street_address'],
                city=addr_data['city'],
                state_province=addr_data['state_province'],
                postal_code=addr_data['postal_code'],
                country=addr_data['country'],
                tax_info=tax_info
            )
        
        # Create invoice
        invoice = Invoice(
            id=row['id'],
            invoice_number=row['invoice_number'],
            client_id=row['client_id'],
            project_id=row['project_id'],
            subscription_id=row['subscription_id'],
            status=InvoiceStatus(row['status']),
            issue_date=row['issue_date'],
            due_date=row['due_date'],
            line_items=line_items,
            billing_address=billing_address,
            notes=row['notes'],
            terms=row['terms'],
            currency=row['currency'],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return invoice


class PostgreSQLSubscriptionRepository(SubscriptionRepository):
    """PostgreSQL implementation of SubscriptionRepository"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
    
    async def get_by_id(self, id: str) -> Optional[Subscription]:
        """Get subscription by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM subscriptions WHERE id = $1", id
            )
            return self._row_to_subscription(row) if row else None
    
    async def save(self, subscription: Subscription) -> Subscription:
        """Save subscription"""
        async with self.pool.acquire() as conn:
            # Check if subscription exists
            existing = await conn.fetchrow(
                "SELECT version FROM subscriptions WHERE id = $1", subscription.id
            )
            
            if existing:
                # Update existing subscription
                if existing['version'] != subscription.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE subscriptions SET
                        client_id = $2,
                        plan_data = $3,
                        status = $4,
                        start_date = $5,
                        end_date = $6,
                        trial_end_date = $7,
                        next_billing_date = $8,
                        quantity = $9,
                        custom_pricing = $10,
                        usage_tracking = $11,
                        billing_address = $12,
                        updated_at = $13,
                        version = $14
                    WHERE id = $1
                """, 
                    subscription.id,
                    subscription.client_id,
                    json.dumps(subscription.plan.dict()),
                    subscription.status.value,
                    subscription.start_date,
                    subscription.end_date,
                    subscription.trial_end_date,
                    subscription.next_billing_date,
                    subscription.quantity,
                    json.dumps(subscription.custom_pricing.dict()) if subscription.custom_pricing else None,
                    json.dumps(subscription.usage_tracking),
                    json.dumps(subscription.billing_address.dict()) if subscription.billing_address else None,
                    subscription.updated_at,
                    subscription.version
                )
            else:
                # Insert new subscription
                await conn.execute("""
                    INSERT INTO subscriptions (
                        id, client_id, plan_data, status, start_date, end_date,
                        trial_end_date, next_billing_date, quantity, custom_pricing,
                        usage_tracking, billing_address, created_at, updated_at, version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                """,
                    subscription.id,
                    subscription.client_id,
                    json.dumps(subscription.plan.dict()),
                    subscription.status.value,
                    subscription.start_date,
                    subscription.end_date,
                    subscription.trial_end_date,
                    subscription.next_billing_date,
                    subscription.quantity,
                    json.dumps(subscription.custom_pricing.dict()) if subscription.custom_pricing else None,
                    json.dumps(subscription.usage_tracking),
                    json.dumps(subscription.billing_address.dict()) if subscription.billing_address else None,
                    subscription.created_at,
                    subscription.updated_at,
                    subscription.version
                )
        
        return subscription
    
    async def delete(self, id: str) -> bool:
        """Delete subscription (soft delete by cancelling)"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE subscriptions SET status = 'Cancelled', updated_at = NOW() WHERE id = $1",
                id
            )
            return result == "UPDATE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[Subscription]:
        """Find all subscriptions"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_subscription(row) for row in rows]
    
    async def find_by_client_id(self, client_id: str) -> List[Subscription]:
        """Find subscriptions by client ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM subscriptions WHERE client_id = $1 ORDER BY created_at DESC",
                client_id
            )
            return [self._row_to_subscription(row) for row in rows]
    
    async def find_by_status(self, status: SubscriptionStatus) -> List[Subscription]:
        """Find subscriptions by status"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM subscriptions WHERE status = $1 ORDER BY created_at DESC",
                status.value
            )
            return [self._row_to_subscription(row) for row in rows]
    
    async def find_by_plan_id(self, plan_id: str) -> List[Subscription]:
        """Find subscriptions by plan ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM subscriptions WHERE plan_data->>'plan_id' = $1 ORDER BY created_at DESC",
                plan_id
            )
            return [self._row_to_subscription(row) for row in rows]
    
    async def find_active_subscriptions(self) -> List[Subscription]:
        """Find all active subscriptions"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM subscriptions WHERE status = 'Active' ORDER BY created_at DESC"
            )
            return [self._row_to_subscription(row) for row in rows]
    
    async def find_expiring_trials(self, days: int = 7) -> List[Subscription]:
        """Find trial subscriptions expiring within specified days"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM subscriptions 
                WHERE status = 'Trial' 
                AND trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '%s days'
                ORDER BY trial_end_date ASC
            """ % days)
            return [self._row_to_subscription(row) for row in rows]
    
    async def find_due_for_billing(self, date: datetime = None) -> List[Subscription]:
        """Find subscriptions due for billing"""
        date = date or datetime.utcnow()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM subscriptions WHERE status = 'Active' AND next_billing_date <= $1",
                date
            )
            return [self._row_to_subscription(row) for row in rows]
    
    async def find_past_due_subscriptions(self) -> List[Subscription]:
        """Find past due subscriptions"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM subscriptions 
                WHERE status = 'Active' 
                AND next_billing_date < NOW() - INTERVAL '1 day'
                ORDER BY next_billing_date ASC
            """)
            return [self._row_to_subscription(row) for row in rows]
    
    async def get_subscription_statistics(self) -> dict:
        """Get subscription statistics"""
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_subscriptions,
                    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_subscriptions,
                    COUNT(CASE WHEN status = 'Trial' THEN 1 END) as trial_subscriptions,
                    COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_subscriptions,
                    AVG(quantity) as avg_quantity
                FROM subscriptions
            """)
            
            return {
                'total_subscriptions': stats['total_subscriptions'],
                'active_subscriptions': stats['active_subscriptions'],
                'trial_subscriptions': stats['trial_subscriptions'],
                'cancelled_subscriptions': stats['cancelled_subscriptions'],
                'average_quantity': float(stats['avg_quantity']) if stats['avg_quantity'] else 0
            }
    
    def _row_to_subscription(self, row) -> Subscription:
        """Convert database row to Subscription domain model"""
        if not row:
            return None
        
        # Parse plan data
        plan_data = json.loads(row['plan_data'])
        
        # Parse pricing tiers if present
        pricing_tiers = []
        if 'pricing_tiers' in plan_data:
            for tier_data in plan_data['pricing_tiers']:
                pricing_tiers.append(PricingTier(
                    min_quantity=tier_data['min_quantity'],
                    max_quantity=tier_data.get('max_quantity'),
                    unit_price=Money(**tier_data['unit_price'])
                ))
        
        plan = SubscriptionPlan(
            plan_id=plan_data['plan_id'],
            name=plan_data['name'],
            description=plan_data.get('description'),
            pricing_model=PricingModel(plan_data['pricing_model']),
            base_price=Money(**plan_data['base_price']),
            billing_cycle=BillingCycle(plan_data['billing_cycle']),
            trial_period_days=plan_data.get('trial_period_days', 0),
            setup_fee=Money(**plan_data['setup_fee']) if plan_data.get('setup_fee') else None,
            pricing_tiers=pricing_tiers,
            features=plan_data.get('features', []),
            usage_limits=plan_data.get('usage_limits', {}),
            is_active=plan_data.get('is_active', True)
        )
        
        # Parse custom pricing
        custom_pricing = None
        if row['custom_pricing']:
            custom_pricing = Money(**json.loads(row['custom_pricing']))
        
        # Parse billing address
        billing_address = None
        if row['billing_address']:
            addr_data = json.loads(row['billing_address'])
            tax_info = None
            if 'tax_info' in addr_data and addr_data['tax_info']:
                tax_info = TaxInfo(**addr_data['tax_info'])
            
            billing_address = BillingAddress(
                company_name=addr_data.get('company_name'),
                street_address=addr_data['street_address'],
                city=addr_data['city'],
                state_province=addr_data['state_province'],
                postal_code=addr_data['postal_code'],
                country=addr_data['country'],
                tax_info=tax_info
            )
        
        # Parse usage tracking
        usage_tracking = json.loads(row['usage_tracking']) if row['usage_tracking'] else {}
        
        # Create subscription
        subscription = Subscription(
            id=row['id'],
            client_id=row['client_id'],
            plan=plan,
            status=SubscriptionStatus(row['status']),
            start_date=row['start_date'],
            end_date=row['end_date'],
            trial_end_date=row['trial_end_date'],
            next_billing_date=row['next_billing_date'],
            quantity=row['quantity'],
            custom_pricing=custom_pricing,
            usage_tracking=usage_tracking,
            billing_address=billing_address,
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return subscription
