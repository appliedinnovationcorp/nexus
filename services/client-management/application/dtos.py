"""
Client Management DTOs (Data Transfer Objects)
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from shared.domain import ClientType, ContactInfo, Money, PaginationRequest
from ..domain.models import Client


class CreateClientRequest(BaseModel):
    """Request DTO for creating a client"""
    name: str = Field(..., min_length=1, max_length=200)
    client_type: ClientType
    contact_info: ContactInfo
    industry: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[Money] = None
    compliance_requirements: Optional[List[str]] = None
    preferred_communication: Optional[str] = "email"
    timezone: Optional[str] = "UTC"
    acquisition_source: Optional[str] = None
    tags: Optional[List[str]] = None


class UpdateClientRequest(BaseModel):
    """Request DTO for updating a client"""
    profile_updates: Optional[Dict[str, Any]] = None
    preferences_updates: Optional[Dict[str, Any]] = None
    assigned_account_manager: Optional[str] = None
    tags_to_add: Optional[List[str]] = None
    tags_to_remove: Optional[List[str]] = None


class ClientResponse(BaseModel):
    """Response DTO for client data"""
    id: str
    name: str
    client_type: ClientType
    contact_info: ContactInfo
    industry: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[Money] = None
    compliance_requirements: List[str] = Field(default_factory=list)
    preferred_communication: str = "email"
    timezone: str = "UTC"
    is_active: bool = True
    lead_score: Optional[int] = None
    acquisition_source: Optional[str] = None
    assigned_account_manager: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    white_label_config: Dict[str, Any] = Field(default_factory=dict)
    notification_settings: Dict[str, bool] = Field(default_factory=dict)
    dashboard_layout: Dict[str, Any] = Field(default_factory=dict)
    language: str = "en"
    theme: str = "light"
    created_at: datetime
    updated_at: datetime
    version: int
    
    @classmethod
    def from_domain(cls, client: Client) -> 'ClientResponse':
        """Convert domain model to response DTO"""
        return cls(
            id=client.id,
            name=client.name,
            client_type=client.client_type,
            contact_info=client.contact_info,
            industry=client.profile.industry,
            company_size=client.profile.company_size,
            annual_revenue=client.profile.annual_revenue,
            compliance_requirements=client.profile.compliance_requirements,
            preferred_communication=client.profile.preferred_communication,
            timezone=client.profile.timezone,
            is_active=client.is_active,
            lead_score=client.lead_score,
            acquisition_source=client.acquisition_source,
            assigned_account_manager=client.assigned_account_manager,
            tags=client.tags,
            white_label_config=client.preferences.white_label_config,
            notification_settings=client.preferences.notification_settings,
            dashboard_layout=client.preferences.dashboard_layout,
            language=client.preferences.language,
            theme=client.preferences.theme,
            created_at=client.created_at,
            updated_at=client.updated_at,
            version=client.version
        )


class ClientSearchRequest(BaseModel):
    """Request DTO for searching clients"""
    query: str = ""
    client_type: Optional[ClientType] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    min_lead_score: Optional[int] = None
    max_lead_score: Optional[int] = None
    industry: Optional[str] = None
    assigned_account_manager: Optional[str] = None
    pagination: PaginationRequest = Field(default_factory=PaginationRequest)


class ClientSegmentationResponse(BaseModel):
    """Response DTO for client segmentation analysis"""
    total_clients: int
    high_value_count: int
    medium_value_count: int
    low_value_count: int
    enterprise_prospects_count: int
    at_risk_clients_count: int
    upsell_candidates_count: int
    client_type_distribution: Dict[str, int]
    segments: Dict[str, List[ClientResponse]]


class ClientStatsResponse(BaseModel):
    """Response DTO for client statistics"""
    total_clients: int
    active_clients: int
    inactive_clients: int
    clients_by_type: Dict[str, int]
    average_lead_score: float
    high_value_clients: int
    clients_with_compliance_requirements: int
    recent_acquisitions: int  # Last 30 days


class LeadScoringRequest(BaseModel):
    """Request DTO for lead scoring"""
    client_id: str


class LeadScoringResponse(BaseModel):
    """Response DTO for lead scoring"""
    client_id: str
    current_score: int
    previous_score: Optional[int] = None
    score_factors: Dict[str, int]
    recommendations: List[str]


class BulkClientUpdateRequest(BaseModel):
    """Request DTO for bulk client updates"""
    client_ids: List[str]
    updates: Dict[str, Any]
    reason: Optional[str] = None


class BulkClientUpdateResponse(BaseModel):
    """Response DTO for bulk client updates"""
    updated_count: int
    failed_updates: List[Dict[str, str]]  # client_id -> error_message
    success_ids: List[str]


class ClientExportRequest(BaseModel):
    """Request DTO for client data export"""
    format: str = Field(default="csv", regex="^(csv|json|xlsx)$")
    filters: Optional[ClientSearchRequest] = None
    include_sensitive_data: bool = False


class ClientImportRequest(BaseModel):
    """Request DTO for client data import"""
    file_format: str = Field(..., regex="^(csv|json|xlsx)$")
    data: List[Dict[str, Any]]
    skip_duplicates: bool = True
    update_existing: bool = False


class ClientImportResponse(BaseModel):
    """Response DTO for client data import"""
    total_records: int
    imported_count: int
    updated_count: int
    skipped_count: int
    failed_count: int
    errors: List[Dict[str, str]]  # row_number -> error_message
