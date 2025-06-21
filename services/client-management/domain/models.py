"""
Client Management Domain Models
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import Field, validator
from shared.domain import AggregateRoot, ValueObject, ClientType, ContactInfo, Money
from shared.events import ClientCreated, ClientUpdated, ClientDeactivated


class ClientProfile(ValueObject):
    """Client profile information"""
    industry: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[Money] = None
    compliance_requirements: List[str] = Field(default_factory=list)
    preferred_communication: str = "email"
    timezone: str = "UTC"


class ClientPreferences(ValueObject):
    """Client preferences and settings"""
    white_label_config: Dict[str, Any] = Field(default_factory=dict)
    notification_settings: Dict[str, bool] = Field(default_factory=dict)
    dashboard_layout: Dict[str, Any] = Field(default_factory=dict)
    language: str = "en"
    theme: str = "light"


class Client(AggregateRoot):
    """Client aggregate root"""
    name: str
    client_type: ClientType
    contact_info: ContactInfo
    profile: ClientProfile = Field(default_factory=ClientProfile)
    preferences: ClientPreferences = Field(default_factory=ClientPreferences)
    is_active: bool = True
    lead_score: Optional[int] = None
    acquisition_source: Optional[str] = None
    assigned_account_manager: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    
    @validator('lead_score')
    def validate_lead_score(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Lead score must be between 0 and 100')
        return v
    
    @classmethod
    def create(
        cls,
        name: str,
        client_type: ClientType,
        contact_info: ContactInfo,
        profile: ClientProfile = None,
        acquisition_source: str = None
    ) -> 'Client':
        """Factory method to create a new client"""
        client = cls(
            name=name,
            client_type=client_type,
            contact_info=contact_info,
            profile=profile or ClientProfile(),
            acquisition_source=acquisition_source
        )
        
        # Add domain event
        client.add_domain_event(ClientCreated(
            aggregate_id=client.id,
            client_name=name,
            client_type=client_type.value,
            contact_email=contact_info.email,
            industry=profile.industry if profile else None
        ))
        
        return client
    
    def update_profile(self, profile: ClientProfile):
        """Update client profile"""
        old_profile = self.profile
        self.profile = profile
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ClientUpdated(
            aggregate_id=self.id,
            updated_fields={
                'profile': profile.dict(),
                'old_profile': old_profile.dict()
            }
        ))
    
    def update_preferences(self, preferences: ClientPreferences):
        """Update client preferences"""
        self.preferences = preferences
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ClientUpdated(
            aggregate_id=self.id,
            updated_fields={'preferences': preferences.dict()}
        ))
    
    def assign_account_manager(self, manager_id: str):
        """Assign account manager to client"""
        old_manager = self.assigned_account_manager
        self.assigned_account_manager = manager_id
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ClientUpdated(
            aggregate_id=self.id,
            updated_fields={
                'assigned_account_manager': manager_id,
                'old_assigned_account_manager': old_manager
            }
        ))
    
    def update_lead_score(self, score: int):
        """Update client lead score"""
        if score < 0 or score > 100:
            raise ValueError('Lead score must be between 0 and 100')
        
        old_score = self.lead_score
        self.lead_score = score
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ClientUpdated(
            aggregate_id=self.id,
            updated_fields={
                'lead_score': score,
                'old_lead_score': old_score
            }
        ))
    
    def add_tag(self, tag: str):
        """Add tag to client"""
        if tag not in self.tags:
            self.tags.append(tag)
            self.updated_at = datetime.utcnow()
            self.version += 1
            
            # Add domain event
            self.add_domain_event(ClientUpdated(
                aggregate_id=self.id,
                updated_fields={'tags_added': [tag]}
            ))
    
    def remove_tag(self, tag: str):
        """Remove tag from client"""
        if tag in self.tags:
            self.tags.remove(tag)
            self.updated_at = datetime.utcnow()
            self.version += 1
            
            # Add domain event
            self.add_domain_event(ClientUpdated(
                aggregate_id=self.id,
                updated_fields={'tags_removed': [tag]}
            ))
    
    def deactivate(self, reason: str):
        """Deactivate client"""
        if not self.is_active:
            raise ValueError('Client is already inactive')
        
        self.is_active = False
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ClientDeactivated(
            aggregate_id=self.id,
            reason=reason
        ))
    
    def reactivate(self):
        """Reactivate client"""
        if self.is_active:
            raise ValueError('Client is already active')
        
        self.is_active = True
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ClientUpdated(
            aggregate_id=self.id,
            updated_fields={'is_active': True}
        ))
    
    def is_enterprise_client(self) -> bool:
        """Check if client is enterprise type"""
        return self.client_type == ClientType.ENTERPRISE
    
    def is_high_value_client(self) -> bool:
        """Check if client is high value based on lead score"""
        return self.lead_score is not None and self.lead_score >= 80
    
    def requires_compliance(self, standard: str) -> bool:
        """Check if client requires specific compliance standard"""
        return standard in self.profile.compliance_requirements
