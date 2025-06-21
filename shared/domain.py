"""
Shared domain models and base classes for AIC Synergy platform
Following DDD and Hexagonal Architecture patterns
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, TypeVar, Generic
from pydantic import BaseModel, Field
import uuid
from enum import Enum

# Type variables
T = TypeVar('T')


class ClientType(str, Enum):
    """Client types for AIC's ICP"""
    SMB = "SMB"
    ENTERPRISE = "Enterprise"
    UNIVERSITY = "University"
    COLOCATION = "Colocation"


class ProjectType(str, Enum):
    """Types of projects AIC delivers"""
    AI_CONSULTING = "AI_Consulting"
    SAAS_DEVELOPMENT = "SaaS_Development"
    INFRASTRUCTURE = "Infrastructure"
    SYSTEM_INTEGRATION = "System_Integration"


class ProjectStatus(str, Enum):
    """Project lifecycle status"""
    DISCOVERY = "Discovery"
    PLANNING = "Planning"
    IN_PROGRESS = "In_Progress"
    TESTING = "Testing"
    DEPLOYMENT = "Deployment"
    COMPLETED = "Completed"
    ON_HOLD = "On_Hold"
    CANCELLED = "Cancelled"


class ComplianceStandard(str, Enum):
    """Compliance standards AIC supports"""
    GDPR = "GDPR"
    CCPA = "CCPA"
    SOC2 = "SOC2"
    ISO27001 = "ISO27001"
    HIPAA = "HIPAA"


class BaseEntity(BaseModel):
    """Base entity class with common fields"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1
    
    class Config:
        validate_assignment = True


class AggregateRoot(BaseEntity):
    """Base aggregate root for DDD"""
    domain_events: List[Any] = Field(default_factory=list, exclude=True)
    
    def add_domain_event(self, event: Any):
        """Add a domain event to be published"""
        self.domain_events.append(event)
    
    def clear_domain_events(self):
        """Clear domain events after publishing"""
        self.domain_events.clear()


class ValueObject(BaseModel):
    """Base value object class"""
    
    class Config:
        frozen = True  # Immutable


# Domain Value Objects
class Address(ValueObject):
    """Address value object"""
    street: str
    city: str
    state: str
    country: str
    postal_code: str


class ContactInfo(ValueObject):
    """Contact information value object"""
    email: str
    phone: Optional[str] = None
    address: Optional[Address] = None


class Money(ValueObject):
    """Money value object"""
    amount: float
    currency: str = "USD"
    
    def add(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(amount=self.amount + other.amount, currency=self.currency)
    
    def multiply(self, factor: float) -> 'Money':
        return Money(amount=self.amount * factor, currency=self.currency)


class TimeRange(ValueObject):
    """Time range value object"""
    start_date: datetime
    end_date: datetime
    
    @property
    def duration_days(self) -> int:
        return (self.end_date - self.start_date).days


# Repository Interfaces (Ports)
class Repository(ABC, Generic[T]):
    """Base repository interface"""
    
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        pass
    
    @abstractmethod
    async def save(self, entity: T) -> T:
        pass
    
    @abstractmethod
    async def delete(self, id: str) -> bool:
        pass
    
    @abstractmethod
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        pass


class Specification(ABC):
    """Base specification for business rules"""
    
    @abstractmethod
    def is_satisfied_by(self, entity: Any) -> bool:
        pass
    
    def and_(self, other: 'Specification') -> 'Specification':
        return AndSpecification(self, other)
    
    def or_(self, other: 'Specification') -> 'Specification':
        return OrSpecification(self, other)
    
    def not_(self) -> 'Specification':
        return NotSpecification(self)


class AndSpecification(Specification):
    def __init__(self, left: Specification, right: Specification):
        self.left = left
        self.right = right
    
    def is_satisfied_by(self, entity: Any) -> bool:
        return self.left.is_satisfied_by(entity) and self.right.is_satisfied_by(entity)


class OrSpecification(Specification):
    def __init__(self, left: Specification, right: Specification):
        self.left = left
        self.right = right
    
    def is_satisfied_by(self, entity: Any) -> bool:
        return self.left.is_satisfied_by(entity) or self.right.is_satisfied_by(entity)


class NotSpecification(Specification):
    def __init__(self, spec: Specification):
        self.spec = spec
    
    def is_satisfied_by(self, entity: Any) -> bool:
        return not self.spec.is_satisfied_by(entity)


# Domain Services Interface
class DomainService(ABC):
    """Base domain service interface"""
    pass


# Application Services Interface
class ApplicationService(ABC):
    """Base application service interface"""
    pass


# Common DTOs
class PaginationRequest(BaseModel):
    """Pagination request DTO"""
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class PaginationResponse(BaseModel, Generic[T]):
    """Pagination response DTO"""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
    
    @classmethod
    def create(cls, items: List[T], total: int, pagination: PaginationRequest):
        pages = (total + pagination.size - 1) // pagination.size
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=pages
        )


class SearchRequest(BaseModel):
    """Search request DTO"""
    query: str
    filters: Dict[str, Any] = Field(default_factory=dict)
    sort_by: Optional[str] = None
    sort_order: str = Field(default="asc", regex="^(asc|desc)$")
    pagination: PaginationRequest = Field(default_factory=PaginationRequest)


# Error Classes
class DomainError(Exception):
    """Base domain error"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class ValidationError(DomainError):
    """Validation error"""
    pass


class NotFoundError(DomainError):
    """Entity not found error"""
    pass


class BusinessRuleViolationError(DomainError):
    """Business rule violation error"""
    pass


class ConcurrencyError(DomainError):
    """Concurrency/optimistic locking error"""
    pass
