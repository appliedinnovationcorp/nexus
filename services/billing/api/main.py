"""
Billing & Subscription Service API
FastAPI application following hexagonal architecture
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, Path, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import uvicorn

from ..application.services import BillingService
from ..application.dtos import (
    CreateInvoiceRequest, UpdateInvoiceRequest, InvoiceResponse,
    CreateSubscriptionRequest, UpdateSubscriptionRequest, SubscriptionResponse,
    PaymentRequest, BillingSearchRequest, RevenueReportResponse,
    UsageTrackingRequest
)
from ..domain.services import (
    InvoiceGenerationService, BillingCalculationService,
    SubscriptionLifecycleService, RevenueAnalyticsService
)
from ..domain.models import InvoiceStatus, SubscriptionStatus
from ..infrastructure.repositories import PostgreSQLInvoiceRepository, PostgreSQLSubscriptionRepository

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
billing_service: Optional[BillingService] = None
invoice_repo: Optional[PostgreSQLInvoiceRepository] = None
subscription_repo: Optional[PostgreSQLSubscriptionRepository] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global billing_service, invoice_repo, subscription_repo
    
    # Initialize repositories
    postgres_conn = os.getenv("POSTGRES_URL", "postgresql://aicuser:aicpass@localhost:5432/aicsynergy")
    
    invoice_repo = PostgreSQLInvoiceRepository(postgres_conn)
    await invoice_repo.initialize()
    
    subscription_repo = PostgreSQLSubscriptionRepository(postgres_conn)
    await subscription_repo.initialize()
    
    # Initialize services
    invoice_generation_service = InvoiceGenerationService(invoice_repo)
    billing_calculation_service = BillingCalculationService()
    lifecycle_service = SubscriptionLifecycleService(subscription_repo)
    analytics_service = RevenueAnalyticsService(invoice_repo, subscription_repo)
    
    billing_service = BillingService(
        invoice_repository=invoice_repo,
        subscription_repository=subscription_repo,
        invoice_generation_service=invoice_generation_service,
        billing_calculation_service=billing_calculation_service,
        lifecycle_service=lifecycle_service,
        analytics_service=analytics_service
    )
    
    logger.info("Billing Service initialized")
    yield
    
    # Cleanup
    if invoice_repo and invoice_repo.pool:
        await invoice_repo.pool.close()
    if subscription_repo and subscription_repo.pool:
        await subscription_repo.pool.close()
    
    logger.info("Billing Service shutdown")


# Create FastAPI app
app = FastAPI(
    title="AIC Synergy - Billing & Subscription Service",
    description="Billing and subscription management microservice for AIC Synergy platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_billing_service() -> BillingService:
    """Dependency injection for billing service"""
    if not billing_service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return billing_service


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "billing"}


# Invoice Management Endpoints
@app.post("/api/v1/invoices", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    request: CreateInvoiceRequest,
    service: BillingService = Depends(get_billing_service)
):
    """Create a new invoice"""
    try:
        return await service.create_invoice(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating invoice: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str = Path(..., description="Invoice ID"),
    service: BillingService = Depends(get_billing_service)
):
    """Get invoice by ID"""
    try:
        invoice = await service.get_invoice(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/invoices/number/{invoice_number}", response_model=InvoiceResponse)
async def get_invoice_by_number(
    invoice_number: str = Path(..., description="Invoice number"),
    service: BillingService = Depends(get_billing_service)
):
    """Get invoice by invoice number"""
    try:
        invoice = await service.get_invoice_by_number(invoice_number)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting invoice by number {invoice_number}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/v1/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str = Path(..., description="Invoice ID"),
    request: UpdateInvoiceRequest = ...,
    service: BillingService = Depends(get_billing_service)
):
    """Update invoice information"""
    try:
        return await service.update_invoice(invoice_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/invoices/{invoice_id}/send", response_model=InvoiceResponse)
async def send_invoice(
    invoice_id: str = Path(..., description="Invoice ID"),
    service: BillingService = Depends(get_billing_service)
):
    """Send invoice to client"""
    try:
        return await service.send_invoice(invoice_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/invoices/{invoice_id}/payment", response_model=InvoiceResponse)
async def process_payment(
    invoice_id: str = Path(..., description="Invoice ID"),
    request: PaymentRequest = ...,
    service: BillingService = Depends(get_billing_service)
):
    """Process payment for invoice"""
    try:
        return await service.process_payment(invoice_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing payment for invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/invoices/{invoice_id}/cancel", response_model=InvoiceResponse)
async def cancel_invoice(
    invoice_id: str = Path(..., description="Invoice ID"),
    reason: Optional[str] = Query(None, description="Cancellation reason"),
    service: BillingService = Depends(get_billing_service)
):
    """Cancel invoice"""
    try:
        return await service.cancel_invoice(invoice_id, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error cancelling invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/invoices/client/{client_id}", response_model=List[InvoiceResponse])
async def get_invoices_by_client(
    client_id: str = Path(..., description="Client ID"),
    service: BillingService = Depends(get_billing_service)
):
    """Get all invoices for a client"""
    try:
        return await service.get_invoices_by_client(client_id)
    except Exception as e:
        logger.error(f"Error getting invoices for client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/invoices/overdue", response_model=List[InvoiceResponse])
async def get_overdue_invoices(
    service: BillingService = Depends(get_billing_service)
):
    """Get all overdue invoices"""
    try:
        return await service.get_overdue_invoices()
    except Exception as e:
        logger.error(f"Error getting overdue invoices: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Subscription Management Endpoints
@app.post("/api/v1/subscriptions", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(
    request: CreateSubscriptionRequest,
    service: BillingService = Depends(get_billing_service)
):
    """Create a new subscription"""
    try:
        return await service.create_subscription(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: str = Path(..., description="Subscription ID"),
    service: BillingService = Depends(get_billing_service)
):
    """Get subscription by ID"""
    try:
        subscription = await service.get_subscription(subscription_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return subscription
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription {subscription_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/v1/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: str = Path(..., description="Subscription ID"),
    request: UpdateSubscriptionRequest = ...,
    service: BillingService = Depends(get_billing_service)
):
    """Update subscription"""
    try:
        return await service.update_subscription(subscription_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating subscription {subscription_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/subscriptions/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: str = Path(..., description="Subscription ID"),
    end_date: Optional[datetime] = Query(None, description="Cancellation end date"),
    service: BillingService = Depends(get_billing_service)
):
    """Cancel subscription"""
    try:
        return await service.cancel_subscription(subscription_id, end_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error cancelling subscription {subscription_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/subscriptions/{subscription_id}/activate", response_model=SubscriptionResponse)
async def activate_subscription(
    subscription_id: str = Path(..., description="Subscription ID"),
    service: BillingService = Depends(get_billing_service)
):
    """Activate trial subscription"""
    try:
        return await service.activate_subscription(subscription_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error activating subscription {subscription_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/subscriptions/{subscription_id}/usage", response_model=SubscriptionResponse)
async def update_usage(
    subscription_id: str = Path(..., description="Subscription ID"),
    request: UsageTrackingRequest = ...,
    service: BillingService = Depends(get_billing_service)
):
    """Update subscription usage tracking"""
    try:
        return await service.update_usage(subscription_id, request.usage_type, request.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating usage for subscription {subscription_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/subscriptions/client/{client_id}", response_model=List[SubscriptionResponse])
async def get_subscriptions_by_client(
    client_id: str = Path(..., description="Client ID"),
    service: BillingService = Depends(get_billing_service)
):
    """Get all subscriptions for a client"""
    try:
        return await service.get_subscriptions_by_client(client_id)
    except Exception as e:
        logger.error(f"Error getting subscriptions for client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Billing Operations
@app.post("/api/v1/billing/process-cycle")
async def process_billing_cycle(
    background_tasks: BackgroundTasks,
    service: BillingService = Depends(get_billing_service)
):
    """Process billing cycle for all due subscriptions"""
    try:
        # Run in background to avoid timeout
        background_tasks.add_task(service.process_billing_cycle)
        return {"message": "Billing cycle processing started"}
    except Exception as e:
        logger.error(f"Error starting billing cycle: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/billing/process-trials")
async def process_trial_expirations(
    service: BillingService = Depends(get_billing_service)
):
    """Process expired trial subscriptions"""
    try:
        result = await service.process_trial_expirations()
        return result
    except Exception as e:
        logger.error(f"Error processing trial expirations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Analytics and Reporting
@app.get("/api/v1/analytics/revenue", response_model=RevenueReportResponse)
async def get_revenue_report(
    start_date: datetime = Query(..., description="Report start date"),
    end_date: datetime = Query(..., description="Report end date"),
    service: BillingService = Depends(get_billing_service)
):
    """Get comprehensive revenue report"""
    try:
        return await service.get_revenue_report(start_date, end_date)
    except Exception as e:
        logger.error(f"Error generating revenue report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/dashboard/billing")
async def get_billing_dashboard(
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    service: BillingService = Depends(get_billing_service)
):
    """Get billing dashboard data"""
    try:
        return await service.get_billing_dashboard(client_id)
    except Exception as e:
        logger.error(f"Error getting billing dashboard: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
