"""
Billing & Subscription Repository Interfaces
"""
from abc import abstractmethod
from typing import List, Optional
from datetime import datetime
from shared.domain import Repository
from .models import Invoice, Subscription, InvoiceStatus, SubscriptionStatus


class InvoiceRepository(Repository[Invoice]):
    """Invoice repository interface"""
    
    @abstractmethod
    async def find_by_client_id(self, client_id: str) -> List[Invoice]:
        """Find invoices by client ID"""
        pass
    
    @abstractmethod
    async def find_by_project_id(self, project_id: str) -> List[Invoice]:
        """Find invoices by project ID"""
        pass
    
    @abstractmethod
    async def find_by_subscription_id(self, subscription_id: str) -> List[Invoice]:
        """Find invoices by subscription ID"""
        pass
    
    @abstractmethod
    async def find_by_status(self, status: InvoiceStatus) -> List[Invoice]:
        """Find invoices by status"""
        pass
    
    @abstractmethod
    async def find_by_invoice_number(self, invoice_number: str) -> Optional[Invoice]:
        """Find invoice by invoice number"""
        pass
    
    @abstractmethod
    async def find_overdue_invoices(self) -> List[Invoice]:
        """Find overdue invoices"""
        pass
    
    @abstractmethod
    async def find_invoices_due_soon(self, days: int = 7) -> List[Invoice]:
        """Find invoices due within specified days"""
        pass
    
    @abstractmethod
    async def find_by_date_range(
        self, 
        start_date: datetime, 
        end_date: datetime,
        client_id: Optional[str] = None
    ) -> List[Invoice]:
        """Find invoices within date range"""
        pass
    
    @abstractmethod
    async def get_revenue_statistics(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> dict:
        """Get revenue statistics for date range"""
        pass


class SubscriptionRepository(Repository[Subscription]):
    """Subscription repository interface"""
    
    @abstractmethod
    async def find_by_client_id(self, client_id: str) -> List[Subscription]:
        """Find subscriptions by client ID"""
        pass
    
    @abstractmethod
    async def find_by_status(self, status: SubscriptionStatus) -> List[Subscription]:
        """Find subscriptions by status"""
        pass
    
    @abstractmethod
    async def find_by_plan_id(self, plan_id: str) -> List[Subscription]:
        """Find subscriptions by plan ID"""
        pass
    
    @abstractmethod
    async def find_active_subscriptions(self) -> List[Subscription]:
        """Find all active subscriptions"""
        pass
    
    @abstractmethod
    async def find_expiring_trials(self, days: int = 7) -> List[Subscription]:
        """Find trial subscriptions expiring within specified days"""
        pass
    
    @abstractmethod
    async def find_due_for_billing(self, date: datetime = None) -> List[Subscription]:
        """Find subscriptions due for billing"""
        pass
    
    @abstractmethod
    async def find_past_due_subscriptions(self) -> List[Subscription]:
        """Find past due subscriptions"""
        pass
    
    @abstractmethod
    async def get_subscription_statistics(self) -> dict:
        """Get subscription statistics"""
        pass
