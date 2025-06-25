"""
Client Management Domain Services
"""
from typing import List, Optional
from shared.domain import DomainService, Specification, ClientType
from .models import Client, ClientProfile
from .repositories import ClientRepository


class ClientLeadScoringService(DomainService):
    """Service for calculating client lead scores"""
    
    def calculate_lead_score(self, client: Client) -> int:
        """Calculate lead score based on client attributes"""
        score = 0
        
        # Base score by client type
        type_scores = {
            ClientType.ENTERPRISE: 40,
            ClientType.UNIVERSITY: 30,
            ClientType.COLOCATION: 35,
            ClientType.SMB: 25
        }
        score += type_scores.get(client.client_type, 20)
        
        # Industry bonus
        high_value_industries = [
            'technology', 'finance', 'healthcare', 'manufacturing'
        ]
        if client.profile.industry and client.profile.industry.lower() in high_value_industries:
            score += 15
        
        # Company size bonus
        if client.profile.company_size:
            size_scores = {
                'startup': 5,
                'small': 10,
                'medium': 20,
                'large': 30,
                'enterprise': 40
            }
            score += size_scores.get(client.profile.company_size.lower(), 0)
        
        # Revenue bonus
        if client.profile.annual_revenue:
            if client.profile.annual_revenue.amount >= 10_000_000:  # $10M+
                score += 20
            elif client.profile.annual_revenue.amount >= 1_000_000:  # $1M+
                score += 10
            elif client.profile.annual_revenue.amount >= 100_000:  # $100K+
                score += 5
        
        # Compliance requirements bonus (shows sophistication)
        if client.profile.compliance_requirements:
            score += min(len(client.profile.compliance_requirements) * 5, 15)
        
        return min(score, 100)  # Cap at 100


class ClientSegmentationService(DomainService):
    """Service for client segmentation and targeting"""
    
    def __init__(self, client_repository: ClientRepository):
        self.client_repository = client_repository
    
    async def get_enterprise_prospects(self) -> List[Client]:
        """Get enterprise clients that are good prospects"""
        clients = await self.client_repository.find_by_type(ClientType.ENTERPRISE)
        return [c for c in clients if c.lead_score and c.lead_score >= 70]
    
    async def get_at_risk_clients(self) -> List[Client]:
        """Get clients that might be at risk of churning"""
        # This would typically involve more complex logic
        # For now, we'll identify clients with low engagement
        all_clients = await self.client_repository.find_active_clients()
        return [c for c in all_clients if c.lead_score and c.lead_score < 30]
    
    async def get_upsell_candidates(self) -> List[Client]:
        """Get clients that are good candidates for upselling"""
        all_clients = await self.client_repository.find_active_clients()
        return [
            c for c in all_clients 
            if c.lead_score and c.lead_score >= 60 
            and c.client_type in [ClientType.SMB, ClientType.UNIVERSITY]
        ]
    
    def segment_by_value(self, clients: List[Client]) -> dict:
        """Segment clients by value tier"""
        segments = {
            'high_value': [],
            'medium_value': [],
            'low_value': []
        }
        
        for client in clients:
            if not client.lead_score:
                segments['low_value'].append(client)
            elif client.lead_score >= 80:
                segments['high_value'].append(client)
            elif client.lead_score >= 50:
                segments['medium_value'].append(client)
            else:
                segments['low_value'].append(client)
        
        return segments


# Specifications for business rules
class HighValueClientSpecification(Specification):
    """Specification for high value clients"""
    
    def __init__(self, min_score: int = 80):
        self.min_score = min_score
    
    def is_satisfied_by(self, client: Client) -> bool:
        return client.lead_score is not None and client.lead_score >= self.min_score


class EnterpriseClientSpecification(Specification):
    """Specification for enterprise clients"""
    
    def is_satisfied_by(self, client: Client) -> bool:
        return client.client_type == ClientType.ENTERPRISE


class ComplianceRequiredSpecification(Specification):
    """Specification for clients requiring compliance"""
    
    def __init__(self, standard: str):
        self.standard = standard
    
    def is_satisfied_by(self, client: Client) -> bool:
        return self.standard in client.profile.compliance_requirements


class ActiveClientSpecification(Specification):
    """Specification for active clients"""
    
    def is_satisfied_by(self, client: Client) -> bool:
        return client.is_active


# Combined specifications for complex business rules
class PremiumClientSpecification(Specification):
    """Specification for premium clients (Enterprise + High Value)"""
    
    def __init__(self):
        self.enterprise_spec = EnterpriseClientSpecification()
        self.high_value_spec = HighValueClientSpecification()
    
    def is_satisfied_by(self, client: Client) -> bool:
        return (self.enterprise_spec.is_satisfied_by(client) and 
                self.high_value_spec.is_satisfied_by(client))


class UpsellCandidateSpecification(Specification):
    """Specification for upsell candidates"""
    
    def __init__(self):
        self.active_spec = ActiveClientSpecification()
        self.medium_value_spec = HighValueClientSpecification(min_score=60)
    
    def is_satisfied_by(self, client: Client) -> bool:
        return (self.active_spec.is_satisfied_by(client) and 
                self.medium_value_spec.is_satisfied_by(client) and
                client.client_type in [ClientType.SMB, ClientType.UNIVERSITY])
