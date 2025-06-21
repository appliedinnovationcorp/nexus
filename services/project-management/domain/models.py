"""
Project Management Domain Models
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import Field, validator
from enum import Enum
from shared.domain import AggregateRoot, ValueObject, ProjectType, ProjectStatus, Money, TimeRange
from shared.events import (
    ProjectCreated, ProjectUpdated, TaskAssigned, MilestoneCompleted
)


class Priority(str, Enum):
    """Task/Project priority levels"""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class TaskStatus(str, Enum):
    """Task status enumeration"""
    TODO = "Todo"
    IN_PROGRESS = "In_Progress"
    REVIEW = "Review"
    TESTING = "Testing"
    COMPLETED = "Completed"
    BLOCKED = "Blocked"
    CANCELLED = "Cancelled"


class RiskLevel(str, Enum):
    """Risk assessment levels"""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class ProjectRisk(ValueObject):
    """Project risk assessment"""
    risk_type: str
    description: str
    probability: float = Field(ge=0.0, le=1.0)  # 0-1 probability
    impact: RiskLevel
    mitigation_plan: Optional[str] = None
    owner: Optional[str] = None
    identified_date: datetime = Field(default_factory=datetime.utcnow)
    target_resolution_date: Optional[datetime] = None


class Task(ValueObject):
    """Task within a project"""
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    assignee_id: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    dependencies: List[str] = Field(default_factory=list)  # Task IDs
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('actual_hours')
    def validate_actual_hours(cls, v, values):
        if v is not None and v < 0:
            raise ValueError('Actual hours cannot be negative')
        return v
    
    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        return (self.due_date is not None and 
                self.due_date < datetime.utcnow() and 
                self.status not in [TaskStatus.COMPLETED, TaskStatus.CANCELLED])
    
    def is_blocked(self) -> bool:
        """Check if task is blocked"""
        return self.status == TaskStatus.BLOCKED


class Milestone(ValueObject):
    """Project milestone"""
    id: str
    name: str
    description: Optional[str] = None
    target_date: datetime
    completion_date: Optional[datetime] = None
    is_completed: bool = False
    deliverables: List[str] = Field(default_factory=list)
    success_criteria: List[str] = Field(default_factory=list)
    
    def is_overdue(self) -> bool:
        """Check if milestone is overdue"""
        return (not self.is_completed and 
                self.target_date < datetime.utcnow())


class ProjectMetrics(ValueObject):
    """Project performance metrics"""
    total_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    blocked_tasks: int = 0
    total_estimated_hours: float = 0.0
    total_actual_hours: float = 0.0
    budget_utilized: Money = Field(default_factory=lambda: Money(amount=0.0))
    completion_percentage: float = 0.0
    
    @property
    def tasks_remaining(self) -> int:
        return self.total_tasks - self.completed_tasks
    
    @property
    def efficiency_ratio(self) -> float:
        """Calculate efficiency ratio (estimated vs actual hours)"""
        if self.total_actual_hours == 0:
            return 1.0
        return self.total_estimated_hours / self.total_actual_hours
    
    @property
    def on_time_delivery_rate(self) -> float:
        """Calculate on-time delivery rate"""
        if self.total_tasks == 0:
            return 1.0
        return (self.completed_tasks - self.overdue_tasks) / self.total_tasks


class Project(AggregateRoot):
    """Project aggregate root"""
    name: str
    description: Optional[str] = None
    client_id: str
    project_type: ProjectType
    status: ProjectStatus = ProjectStatus.DISCOVERY
    priority: Priority = Priority.MEDIUM
    budget: Money
    time_range: TimeRange
    project_manager_id: Optional[str] = None
    team_members: List[str] = Field(default_factory=list)  # User IDs
    tasks: List[Task] = Field(default_factory=list)
    milestones: List[Milestone] = Field(default_factory=list)
    risks: List[ProjectRisk] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('budget')
    def validate_budget(cls, v):
        if v.amount <= 0:
            raise ValueError('Budget must be positive')
        return v
    
    @classmethod
    def create(
        cls,
        name: str,
        client_id: str,
        project_type: ProjectType,
        budget: Money,
        start_date: datetime,
        estimated_end_date: datetime,
        description: str = None,
        project_manager_id: str = None
    ) -> 'Project':
        """Factory method to create a new project"""
        time_range = TimeRange(start_date=start_date, end_date=estimated_end_date)
        
        project = cls(
            name=name,
            description=description,
            client_id=client_id,
            project_type=project_type,
            budget=budget,
            time_range=time_range,
            project_manager_id=project_manager_id
        )
        
        # Add domain event
        project.add_domain_event(ProjectCreated(
            aggregate_id=project.id,
            client_id=client_id,
            project_name=name,
            project_type=project_type.value,
            estimated_duration_days=time_range.duration_days,
            budget=budget.amount
        ))
        
        return project
    
    def update_status(self, new_status: ProjectStatus, reason: str = None):
        """Update project status"""
        old_status = self.status
        self.status = new_status
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ProjectUpdated(
            aggregate_id=self.id,
            updated_fields={
                'status': new_status.value,
                'old_status': old_status.value,
                'reason': reason
            }
        ))
    
    def assign_project_manager(self, manager_id: str):
        """Assign project manager"""
        old_manager = self.project_manager_id
        self.project_manager_id = manager_id
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ProjectUpdated(
            aggregate_id=self.id,
            updated_fields={
                'project_manager_id': manager_id,
                'old_project_manager_id': old_manager
            }
        ))
    
    def add_team_member(self, user_id: str):
        """Add team member to project"""
        if user_id not in self.team_members:
            self.team_members.append(user_id)
            self.updated_at = datetime.utcnow()
            self.version += 1
            
            # Add domain event
            self.add_domain_event(ProjectUpdated(
                aggregate_id=self.id,
                updated_fields={'team_member_added': user_id}
            ))
    
    def remove_team_member(self, user_id: str):
        """Remove team member from project"""
        if user_id in self.team_members:
            self.team_members.remove(user_id)
            self.updated_at = datetime.utcnow()
            self.version += 1
            
            # Add domain event
            self.add_domain_event(ProjectUpdated(
                aggregate_id=self.id,
                updated_fields={'team_member_removed': user_id}
            ))
    
    def add_task(self, task: Task):
        """Add task to project"""
        # Check if task ID already exists
        if any(t.id == task.id for t in self.tasks):
            raise ValueError(f"Task with ID {task.id} already exists")
        
        self.tasks.append(task)
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event if task is assigned
        if task.assignee_id:
            self.add_domain_event(TaskAssigned(
                aggregate_id=self.id,
                task_id=task.id,
                assignee_id=task.assignee_id,
                due_date=task.due_date or datetime.utcnow() + timedelta(days=7)
            ))
    
    def update_task(self, task_id: str, updates: Dict[str, Any]):
        """Update a task"""
        task_index = next((i for i, t in enumerate(self.tasks) if t.id == task_id), None)
        if task_index is None:
            raise ValueError(f"Task {task_id} not found")
        
        current_task = self.tasks[task_index]
        
        # Create updated task
        task_dict = current_task.dict()
        task_dict.update(updates)
        task_dict['updated_at'] = datetime.utcnow()
        
        updated_task = Task(**task_dict)
        self.tasks[task_index] = updated_task
        
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event for assignment changes
        if 'assignee_id' in updates and updates['assignee_id'] != current_task.assignee_id:
            self.add_domain_event(TaskAssigned(
                aggregate_id=self.id,
                task_id=task_id,
                assignee_id=updates['assignee_id'],
                due_date=updated_task.due_date or datetime.utcnow() + timedelta(days=7)
            ))
    
    def complete_task(self, task_id: str):
        """Mark task as completed"""
        self.update_task(task_id, {
            'status': TaskStatus.COMPLETED,
            'completed_date': datetime.utcnow()
        })
    
    def add_milestone(self, milestone: Milestone):
        """Add milestone to project"""
        if any(m.id == milestone.id for m in self.milestones):
            raise ValueError(f"Milestone with ID {milestone.id} already exists")
        
        self.milestones.append(milestone)
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def complete_milestone(self, milestone_id: str):
        """Mark milestone as completed"""
        milestone_index = next((i for i, m in enumerate(self.milestones) if m.id == milestone_id), None)
        if milestone_index is None:
            raise ValueError(f"Milestone {milestone_id} not found")
        
        milestone = self.milestones[milestone_index]
        if milestone.is_completed:
            raise ValueError(f"Milestone {milestone_id} is already completed")
        
        # Update milestone
        milestone_dict = milestone.dict()
        milestone_dict.update({
            'is_completed': True,
            'completion_date': datetime.utcnow()
        })
        
        self.milestones[milestone_index] = Milestone(**milestone_dict)
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(MilestoneCompleted(
            aggregate_id=self.id,
            milestone_id=milestone_id,
            completion_date=datetime.utcnow()
        ))
    
    def add_risk(self, risk: ProjectRisk):
        """Add risk to project"""
        self.risks.append(risk)
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ProjectUpdated(
            aggregate_id=self.id,
            updated_fields={'risk_added': risk.dict()}
        ))
    
    def calculate_metrics(self) -> ProjectMetrics:
        """Calculate project metrics"""
        total_tasks = len(self.tasks)
        completed_tasks = len([t for t in self.tasks if t.status == TaskStatus.COMPLETED])
        overdue_tasks = len([t for t in self.tasks if t.is_overdue()])
        blocked_tasks = len([t for t in self.tasks if t.is_blocked()])
        
        total_estimated = sum(t.estimated_hours or 0 for t in self.tasks)
        total_actual = sum(t.actual_hours or 0 for t in self.tasks)
        
        completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return ProjectMetrics(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            overdue_tasks=overdue_tasks,
            blocked_tasks=blocked_tasks,
            total_estimated_hours=total_estimated,
            total_actual_hours=total_actual,
            completion_percentage=completion_percentage
        )
    
    def is_overdue(self) -> bool:
        """Check if project is overdue"""
        return (self.status not in [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] and
                self.time_range.end_date < datetime.utcnow())
    
    def is_at_risk(self) -> bool:
        """Check if project is at risk"""
        # Project is at risk if it has high/critical risks or is significantly behind schedule
        has_high_risks = any(r.impact in [RiskLevel.HIGH, RiskLevel.CRITICAL] for r in self.risks)
        
        metrics = self.calculate_metrics()
        behind_schedule = (metrics.completion_percentage < 50 and 
                          datetime.utcnow() > self.time_range.start_date + 
                          timedelta(days=self.time_range.duration_days * 0.6))
        
        return has_high_risks or behind_schedule or self.is_overdue()
    
    def get_critical_path_tasks(self) -> List[Task]:
        """Get tasks on the critical path (simplified implementation)"""
        # This is a simplified version - real critical path analysis would be more complex
        return [t for t in self.tasks if t.priority == Priority.CRITICAL or 
                (t.due_date and t.due_date <= datetime.utcnow() + timedelta(days=3))]
    
    def get_next_milestone(self) -> Optional[Milestone]:
        """Get the next upcoming milestone"""
        upcoming_milestones = [m for m in self.milestones if not m.is_completed]
        if not upcoming_milestones:
            return None
        
        return min(upcoming_milestones, key=lambda m: m.target_date)
