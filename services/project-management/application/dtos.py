"""
Project Management DTOs (Data Transfer Objects)
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from shared.domain import ProjectType, ProjectStatus, Money, PaginationRequest
from ..domain.models import Project, Task, Milestone, Priority, TaskStatus, ProjectMetrics


class CreateMilestoneRequest(BaseModel):
    """Request DTO for creating a milestone"""
    id: str
    name: str
    description: Optional[str] = None
    target_date: datetime
    deliverables: Optional[List[str]] = None
    success_criteria: Optional[List[str]] = None


class CreateProjectRequest(BaseModel):
    """Request DTO for creating a project"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    client_id: str
    project_type: ProjectType
    budget: Money
    start_date: datetime
    estimated_end_date: datetime
    project_manager_id: Optional[str] = None
    priority: Optional[Priority] = Priority.MEDIUM
    team_members: Optional[List[str]] = None
    initial_milestones: Optional[List[CreateMilestoneRequest]] = None
    tags: Optional[List[str]] = None


class UpdateProjectRequest(BaseModel):
    """Request DTO for updating a project"""
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    budget: Optional[Money] = None
    start_date: Optional[datetime] = None
    estimated_end_date: Optional[datetime] = None
    project_manager_id: Optional[str] = None
    team_members_to_add: Optional[List[str]] = None
    team_members_to_remove: Optional[List[str]] = None
    tags_to_add: Optional[List[str]] = None
    tags_to_remove: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class CreateTaskRequest(BaseModel):
    """Request DTO for creating a task"""
    id: str
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[Priority] = Priority.MEDIUM
    assignee_id: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, ge=0)
    due_date: Optional[datetime] = None
    dependencies: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class UpdateTaskRequest(BaseModel):
    """Request DTO for updating a task"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    assignee_id: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, ge=0)
    actual_hours: Optional[float] = Field(None, ge=0)
    due_date: Optional[datetime] = None
    dependencies: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class TaskResponse(BaseModel):
    """Response DTO for task data"""
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: Priority
    assignee_id: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    dependencies: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    is_overdue: bool = False
    is_blocked: bool = False
    
    @classmethod
    def from_domain(cls, task: Task) -> 'TaskResponse':
        """Convert domain model to response DTO"""
        return cls(
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            assignee_id=task.assignee_id,
            estimated_hours=task.estimated_hours,
            actual_hours=task.actual_hours,
            due_date=task.due_date,
            completed_date=task.completed_date,
            dependencies=task.dependencies,
            tags=task.tags,
            created_at=task.created_at,
            updated_at=task.updated_at,
            is_overdue=task.is_overdue(),
            is_blocked=task.is_blocked()
        )


class MilestoneResponse(BaseModel):
    """Response DTO for milestone data"""
    id: str
    name: str
    description: Optional[str] = None
    target_date: datetime
    completion_date: Optional[datetime] = None
    is_completed: bool = False
    deliverables: List[str] = Field(default_factory=list)
    success_criteria: List[str] = Field(default_factory=list)
    is_overdue: bool = False
    
    @classmethod
    def from_domain(cls, milestone: Milestone) -> 'MilestoneResponse':
        """Convert domain model to response DTO"""
        return cls(
            id=milestone.id,
            name=milestone.name,
            description=milestone.description,
            target_date=milestone.target_date,
            completion_date=milestone.completion_date,
            is_completed=milestone.is_completed,
            deliverables=milestone.deliverables,
            success_criteria=milestone.success_criteria,
            is_overdue=milestone.is_overdue()
        )


class ProjectResponse(BaseModel):
    """Response DTO for project data"""
    id: str
    name: str
    description: Optional[str] = None
    client_id: str
    project_type: ProjectType
    status: ProjectStatus
    priority: Priority
    budget: Money
    start_date: datetime
    estimated_end_date: datetime
    project_manager_id: Optional[str] = None
    team_members: List[str] = Field(default_factory=list)
    tasks: List[TaskResponse] = Field(default_factory=list)
    milestones: List[MilestoneResponse] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    version: int
    is_overdue: bool = False
    is_at_risk: bool = False
    completion_percentage: float = 0.0
    
    @classmethod
    def from_domain(cls, project: Project) -> 'ProjectResponse':
        """Convert domain model to response DTO"""
        metrics = project.calculate_metrics()
        
        return cls(
            id=project.id,
            name=project.name,
            description=project.description,
            client_id=project.client_id,
            project_type=project.project_type,
            status=project.status,
            priority=project.priority,
            budget=project.budget,
            start_date=project.time_range.start_date,
            estimated_end_date=project.time_range.end_date,
            project_manager_id=project.project_manager_id,
            team_members=project.team_members,
            tasks=[TaskResponse.from_domain(task) for task in project.tasks],
            milestones=[MilestoneResponse.from_domain(milestone) for milestone in project.milestones],
            tags=project.tags,
            custom_fields=project.custom_fields,
            created_at=project.created_at,
            updated_at=project.updated_at,
            version=project.version,
            is_overdue=project.is_overdue(),
            is_at_risk=project.is_at_risk(),
            completion_percentage=metrics.completion_percentage
        )


class ProjectSearchRequest(BaseModel):
    """Request DTO for searching projects"""
    query: str = ""
    client_id: Optional[str] = None
    project_type: Optional[ProjectType] = None
    status: Optional[ProjectStatus] = None
    project_manager_id: Optional[str] = None
    team_member_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_overdue: Optional[bool] = None
    is_at_risk: Optional[bool] = None
    pagination: PaginationRequest = Field(default_factory=PaginationRequest)


class ProjectAnalyticsResponse(BaseModel):
    """Response DTO for project analytics"""
    project_id: str
    metrics: ProjectMetrics
    risk_assessment: Dict[str, Any]
    critical_path_tasks: List[str]
    task_reallocation_suggestions: Dict[str, List[str]]
    next_milestone: Optional[MilestoneResponse] = None
    overdue_tasks: List[TaskResponse] = Field(default_factory=list)
    blocked_tasks: List[TaskResponse] = Field(default_factory=list)


class ProjectSummaryResponse(BaseModel):
    """Response DTO for project summary"""
    id: str
    name: str
    client_id: str
    status: ProjectStatus
    priority: Priority
    completion_percentage: float
    is_overdue: bool
    is_at_risk: bool
    next_milestone_date: Optional[datetime] = None
    overdue_tasks_count: int = 0
    team_size: int = 0


class TaskSearchRequest(BaseModel):
    """Request DTO for searching tasks"""
    query: str = ""
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    is_overdue: Optional[bool] = None
    is_blocked: Optional[bool] = None
    due_within_days: Optional[int] = None
    tags: Optional[List[str]] = None
    pagination: PaginationRequest = Field(default_factory=PaginationRequest)


class BulkTaskUpdateRequest(BaseModel):
    """Request DTO for bulk task updates"""
    task_ids: List[str]
    updates: Dict[str, Any]
    reason: Optional[str] = None


class BulkTaskUpdateResponse(BaseModel):
    """Response DTO for bulk task updates"""
    updated_count: int
    failed_updates: List[Dict[str, str]]  # task_id -> error_message
    success_ids: List[str]


class ProjectTemplateRequest(BaseModel):
    """Request DTO for creating project from template"""
    template_id: str
    name: str
    client_id: str
    start_date: datetime
    budget: Money
    project_manager_id: Optional[str] = None
    customizations: Optional[Dict[str, Any]] = None


class ProjectCloneRequest(BaseModel):
    """Request DTO for cloning a project"""
    source_project_id: str
    name: str
    client_id: str
    start_date: datetime
    include_tasks: bool = True
    include_milestones: bool = True
    include_team_members: bool = False


class ProjectReportRequest(BaseModel):
    """Request DTO for project reports"""
    project_ids: Optional[List[str]] = None
    client_id: Optional[str] = None
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    report_type: str = Field(..., regex="^(summary|detailed|timeline|resource_utilization)$")
    format: str = Field(default="json", regex="^(json|pdf|xlsx)$")


class ResourceAllocationResponse(BaseModel):
    """Response DTO for resource allocation analysis"""
    team_member_id: str
    allocated_hours: float
    capacity_hours: float
    utilization_percentage: float
    overallocated: bool
    projects: List[Dict[str, Any]]  # project_id, project_name, allocated_hours
    recommendations: List[str]
