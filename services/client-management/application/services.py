"""
Client Management Application Services
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from shared.domain import ApplicationService, ClientType, ContactInfo, PaginationRequest, PaginationResponse
from shared.event_bus import publish_event
from ..domain.models import Client, ClientProfile, ClientPreferences
from ..domain.repositories import ClientRepository
from ..domain.services import ClientLeadScoringService, ClientSegmentationService
from .dtos import (
    CreateClientRequest, UpdateClientRequest, ClientResponse, 
    ClientSearchRequest, ClientSegmentationResponse
)


class ClientManagementService(ApplicationService):
    """Application service for client management operations"""
    
    def __init__(
        self,
        client_repository: ClientRepository,
        lead_scoring_service: ClientLeadScoringService,
        segmentation_service: ClientSegmentationService
    ):
        self.client_repository = client_repository
        self.lead_scoring_service = lead_scoring_service
        self.segmentation_service = segmentation_service
    
    async def create_client(self, request: CreateClientRequest) -> ClientResponse:
        """Create a new client"""
        # Check if client already exists
        existing_client = await self.client_repository.find_by_email(request.contact_info.email)
        if existing_client:
            raise ValueError(f"Client with email {request.contact_info.email} already exists")
        
        # Create client profile
        profile = ClientProfile(
            industry=request.industry,
            company_size=request.company_size,
            annual_revenue=request.annual_revenue,
            compliance_requirements=request.compliance_requirements or [],
            preferred_communication=request.preferred_communication or "email",
            timezone=request.timezone or "UTC"
        )
        
        # Create client
        client = Client.create(
            name=request.name,
            client_type=request.client_type,
            contact_info=request.contact_info,
            profile=profile,
            acquisition_source=request.acquisition_source
        )
        
        # Calculate lead score
        lead_score = self.lead_scoring_service.calculate_lead_score(client)
        client.update_lead_score(lead_score)
        
        # Add tags if provided
        for tag in request.tags or []:
            client.add_tag(tag)
        
        # Save client
        saved_client = await self.client_repository.save(client)
        
        # Publish domain events
        for event in saved_client.domain_events:
            await publish_event(event)
        saved_client.clear_domain_events()
        
        return ClientResponse.from_domain(saved_client)
    
    async def get_client(self, client_id: str) -> Optional[ClientResponse]:
        """Get client by ID"""
        client = await self.client_repository.get_by_id(client_id)
        return ClientResponse.from_domain(client) if client else None
    
    async def update_client(self, client_id: str, request: UpdateClientRequest) -> ClientResponse:
        """Update client information"""
        client = await self.client_repository.get_by_id(client_id)
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        # Update profile if provided
        if request.profile_updates:
            current_profile = client.profile
            updated_profile = ClientProfile(
                industry=request.profile_updates.get('industry', current_profile.industry),
                company_size=request.profile_updates.get('company_size', current_profile.company_size),
                annual_revenue=request.profile_updates.get('annual_revenue', current_profile.annual_revenue),
                compliance_requirements=request.profile_updates.get('compliance_requirements', current_profile.compliance_requirements),
                preferred_communication=request.profile_updates.get('preferred_communication', current_profile.preferred_communication),
                timezone=request.profile_updates.get('timezone', current_profile.timezone)
            )
            client.update_profile(updated_profile)
        
        # Update preferences if provided
        if request.preferences_updates:
            current_prefs = client.preferences
            updated_prefs = ClientPreferences(
                white_label_config=request.preferences_updates.get('white_label_config', current_prefs.white_label_config),
                notification_settings=request.preferences_updates.get('notification_settings', current_prefs.notification_settings),
                dashboard_layout=request.preferences_updates.get('dashboard_layout', current_prefs.dashboard_layout),
                language=request.preferences_updates.get('language', current_prefs.language),
                theme=request.preferences_updates.get('theme', current_prefs.theme)
            )
            client.update_preferences(updated_prefs)
        
        # Update account manager if provided
        if request.assigned_account_manager is not None:
            client.assign_account_manager(request.assigned_account_manager)
        
        # Add/remove tags
        if request.tags_to_add:
            for tag in request.tags_to_add:
                client.add_tag(tag)
        
        if request.tags_to_remove:
            for tag in request.tags_to_remove:
                client.remove_tag(tag)
        
        # Recalculate lead score if profile changed
        if request.profile_updates:
            new_score = self.lead_scoring_service.calculate_lead_score(client)
            client.update_lead_score(new_score)
        
        # Save client
        saved_client = await self.client_repository.save(client)
        
        # Publish domain events
        for event in saved_client.domain_events:
            await publish_event(event)
        saved_client.clear_domain_events()
        
        return ClientResponse.from_domain(saved_client)
    
    async def deactivate_client(self, client_id: str, reason: str) -> ClientResponse:
        """Deactivate a client"""
        client = await self.client_repository.get_by_id(client_id)
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        client.deactivate(reason)
        saved_client = await self.client_repository.save(client)
        
        # Publish domain events
        for event in saved_client.domain_events:
            await publish_event(event)
        saved_client.clear_domain_events()
        
        return ClientResponse.from_domain(saved_client)
    
    async def reactivate_client(self, client_id: str) -> ClientResponse:
        """Reactivate a client"""
        client = await self.client_repository.get_by_id(client_id)
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        client.reactivate()
        saved_client = await self.client_repository.save(client)
        
        # Publish domain events
        for event in saved_client.domain_events:
            await publish_event(event)
        saved_client.clear_domain_events()
        
        return ClientResponse.from_domain(saved_client)
    
    async def search_clients(self, request: ClientSearchRequest) -> PaginationResponse[ClientResponse]:
        """Search clients with filters"""
        clients = await self.client_repository.search_clients(
            query=request.query,
            client_type=request.client_type,
            is_active=request.is_active,
            limit=request.pagination.size,
            offset=request.pagination.offset
        )
        
        # Convert to response DTOs
        client_responses = [ClientResponse.from_domain(client) for client in clients]
        
        # Get total count (simplified - in real implementation, you'd have a separate count query)
        total = len(client_responses)
        
        return PaginationResponse.create(client_responses, total, request.pagination)
    
    async def get_clients_by_type(self, client_type: ClientType) -> List[ClientResponse]:
        """Get all clients of a specific type"""
        clients = await self.client_repository.find_by_type(client_type)
        return [ClientResponse.from_domain(client) for client in clients]
    
    async def get_high_value_clients(self, min_score: int = 80) -> List[ClientResponse]:
        """Get high value clients"""
        clients = await self.client_repository.find_high_value_clients(min_score)
        return [ClientResponse.from_domain(client) for client in clients]
    
    async def get_client_segmentation(self) -> ClientSegmentationResponse:
        """Get client segmentation analysis"""
        all_clients = await self.client_repository.find_active_clients()
        
        # Get segmentation data
        segments = self.segmentation_service.segment_by_value(all_clients)
        enterprise_prospects = await self.segmentation_service.get_enterprise_prospects()
        at_risk_clients = await self.segmentation_service.get_at_risk_clients()
        upsell_candidates = await self.segmentation_service.get_upsell_candidates()
        
        # Get counts by type
        type_counts = await self.client_repository.get_client_count_by_type()
        
        return ClientSegmentationResponse(
            total_clients=len(all_clients),
            high_value_count=len(segments['high_value']),
            medium_value_count=len(segments['medium_value']),
            low_value_count=len(segments['low_value']),
            enterprise_prospects_count=len(enterprise_prospects),
            at_risk_clients_count=len(at_risk_clients),
            upsell_candidates_count=len(upsell_candidates),
            client_type_distribution=type_counts,
            segments={
                'high_value': [ClientResponse.from_domain(c) for c in segments['high_value']],
                'medium_value': [ClientResponse.from_domain(c) for c in segments['medium_value']],
                'low_value': [ClientResponse.from_domain(c) for c in segments['low_value']]
            }
        )
    
    async def recalculate_all_lead_scores(self) -> Dict[str, int]:
        """Recalculate lead scores for all clients"""
        all_clients = await self.client_repository.find_all()
        updated_scores = {}
        
        for client in all_clients:
            new_score = self.lead_scoring_service.calculate_lead_score(client)
            if client.lead_score != new_score:
                client.update_lead_score(new_score)
                await self.client_repository.save(client)
                
                # Publish domain events
                for event in client.domain_events:
                    await publish_event(event)
                client.clear_domain_events()
                
                updated_scores[client.id] = new_score
        
        return updated_scores
