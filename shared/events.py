"""
Shared event definitions for AIC Synergy platform
Following Event Sourcing and DDD patterns
"""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
import uuid


class BaseEvent(BaseModel):
    """Base event class for all domain events"""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    aggregate_id: str
    aggregate_type: str
    event_version: int = 1
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None
    causation_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# Client Management Events
class ClientCreated(BaseEvent):
    event_type: str = "ClientCreated"
    aggregate_type: str = "Client"
    client_name: str
    client_type: str  # SMB, Enterprise, University, Colocation
    contact_email: str
    industry: Optional[str] = None


class ClientUpdated(BaseEvent):
    event_type: str = "ClientUpdated"
    aggregate_type: str = "Client"
    updated_fields: Dict[str, Any]


class ClientDeactivated(BaseEvent):
    event_type: str = "ClientDeactivated"
    aggregate_type: str = "Client"
    reason: str


# Project Management Events
class ProjectCreated(BaseEvent):
    event_type: str = "ProjectCreated"
    aggregate_type: str = "Project"
    client_id: str
    project_name: str
    project_type: str  # AI Consulting, SaaS, Infrastructure
    estimated_duration_days: int
    budget: float


class ProjectUpdated(BaseEvent):
    event_type: str = "ProjectUpdated"
    aggregate_type: str = "Project"
    updated_fields: Dict[str, Any]


class TaskAssigned(BaseEvent):
    event_type: str = "TaskAssigned"
    aggregate_type: str = "Project"
    task_id: str
    assignee_id: str
    due_date: datetime


class MilestoneCompleted(BaseEvent):
    event_type: str = "MilestoneCompleted"
    aggregate_type: str = "Project"
    milestone_id: str
    completion_date: datetime


# Billing Events
class InvoiceCreated(BaseEvent):
    event_type: str = "InvoiceCreated"
    aggregate_type: str = "Invoice"
    client_id: str
    project_id: Optional[str] = None
    amount: float
    currency: str = "USD"
    due_date: datetime


class InvoicePaid(BaseEvent):
    event_type: str = "InvoicePaid"
    aggregate_type: str = "Invoice"
    payment_amount: float
    payment_date: datetime
    payment_method: str


class SubscriptionCreated(BaseEvent):
    event_type: str = "SubscriptionCreated"
    aggregate_type: str = "Subscription"
    client_id: str
    plan_type: str
    monthly_amount: float


# AI Model Events
class ModelDeployed(BaseEvent):
    event_type: str = "ModelDeployed"
    aggregate_type: str = "AIModel"
    model_name: str
    model_version: str
    client_id: str
    deployment_environment: str


class ModelPredictionRequested(BaseEvent):
    event_type: str = "ModelPredictionRequested"
    aggregate_type: str = "AIModel"
    model_id: str
    client_id: str
    input_data_hash: str


# Integration Events
class IntegrationCreated(BaseEvent):
    event_type: str = "IntegrationCreated"
    aggregate_type: str = "Integration"
    client_id: str
    integration_type: str
    target_system: str


class IntegrationPublished(BaseEvent):
    event_type: str = "IntegrationPublished"
    aggregate_type: str = "Integration"
    plugin_id: str
    developer_id: str
    marketplace_category: str


# Marketing Events
class LeadGenerated(BaseEvent):
    event_type: str = "LeadGenerated"
    aggregate_type: str = "Lead"
    email: str
    source: str
    lead_score: Optional[int] = None


class LeadSubmitted(BaseEvent):
    event_type: str = "LeadSubmitted"
    aggregate_type: str = "Lead"
    form_data: Dict[str, Any]
    page_url: str


# Compliance Events
class ComplianceCheckCompleted(BaseEvent):
    event_type: str = "ComplianceCheckCompleted"
    aggregate_type: str = "Compliance"
    client_id: str
    check_type: str  # GDPR, CCPA, SOC2, ISO27001
    status: str  # PASSED, FAILED, WARNING
    findings: List[str] = Field(default_factory=list)


# Infrastructure Events
class ResourceUsageRecorded(BaseEvent):
    event_type: str = "ResourceUsageRecorded"
    aggregate_type: str = "Infrastructure"
    client_id: str
    resource_type: str
    usage_amount: float
    usage_unit: str
    recorded_at: datetime


class EnergyConsumptionRecorded(BaseEvent):
    event_type: str = "EnergyConsumptionRecorded"
    aggregate_type: str = "Infrastructure"
    client_id: str
    energy_kwh: float
    carbon_footprint_kg: float


# Notification Events
class NotificationSent(BaseEvent):
    event_type: str = "NotificationSent"
    aggregate_type: str = "Notification"
    recipient_id: str
    channel: str  # email, sms, in-app
    message_type: str
    delivery_status: str


# User Management Events
class UserRegistered(BaseEvent):
    event_type: str = "UserRegistered"
    aggregate_type: str = "User"
    user_email: str
    user_role: str
    client_id: Optional[str] = None


class RoleUpdated(BaseEvent):
    event_type: str = "RoleUpdated"
    aggregate_type: str = "User"
    user_id: str
    old_role: str
    new_role: str
