"""
Project Management Application Services
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from shared.domain import ApplicationService, ProjectType, ProjectStatus, Money, TimeRange, PaginationRequest, PaginationResponse
from shared.event_bus import publish_event
from ..domain.models import Project, Task, Milestone, ProjectRisk, Priority, TaskStatus
from ..domain.repositories import ProjectRepository
from ..domain.services import ProjectRiskAssessmentService, ProjectSchedulingService
from .dtos import (
    CreateProjectRequest, UpdateProjectRequest, ProjectResponse,
    CreateTaskRequest, UpdateTaskRequest, TaskResponse,
    CreateMilestoneRequest, MilestoneResponse,
    ProjectSearchRequest, ProjectAnalyticsResponse
)


class ProjectManagementService(ApplicationService):
    """Application service for project management operations"""
    
    def __init__(
        self,
        project_repository: ProjectRepository,
        risk_assessment_service: ProjectRiskAssessmentService,
        scheduling_service: ProjectSchedulingService
    ):
        self.project_repository = project_repository
        self.risk_assessment_service = risk_assessment_service
        self.scheduling_service = scheduling_service
    
    async def create_project(self, request: CreateProjectRequest) -> ProjectResponse:
        """Create a new project"""
        # Create time range
        time_range = TimeRange(
            start_date=request.start_date,
            end_date=request.estimated_end_date
        )
        
        # Create project
        project = Project.create(
            name=request.name,
            client_id=request.client_id,
            project_type=request.project_type,
            budget=request.budget,
            start_date=request.start_date,
            estimated_end_date=request.estimated_end_date,
            description=request.description,
            project_manager_id=request.project_manager_id
        )
        
        # Set priority if provided
        if request.priority:
            project.priority = request.priority
        
        # Add team members
        for member_id in request.team_members or []:
            project.add_team_member(member_id)
        
        # Add initial milestones
        for milestone_req in request.initial_milestones or []:
            milestone = Milestone(
                id=milestone_req.id,
                name=milestone_req.name,
                description=milestone_req.description,
                target_date=milestone_req.target_date,
                deliverables=milestone_req.deliverables or [],
                success_criteria=milestone_req.success_criteria or []
            )
            project.add_milestone(milestone)
        
        # Add tags
        for tag in request.tags or []:
            project.tags.append(tag)
        
        # Save project
        saved_project = await self.project_repository.save(project)
        
        # Publish domain events
        for event in saved_project.domain_events:
            await publish_event(event)
        saved_project.clear_domain_events()
        
        return ProjectResponse.from_domain(saved_project)
    
    async def get_project(self, project_id: str) -> Optional[ProjectResponse]:
        """Get project by ID"""
        project = await self.project_repository.get_by_id(project_id)
        return ProjectResponse.from_domain(project) if project else None
    
    async def update_project(self, project_id: str, request: UpdateProjectRequest) -> ProjectResponse:
        """Update project information"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        # Update basic fields
        if request.name is not None:
            project.name = request.name
        
        if request.description is not None:
            project.description = request.description
        
        if request.priority is not None:
            project.priority = request.priority
        
        if request.budget is not None:
            project.budget = request.budget
        
        # Update time range
        if request.start_date or request.estimated_end_date:
            new_start = request.start_date or project.time_range.start_date
            new_end = request.estimated_end_date or project.time_range.end_date
            project.time_range = TimeRange(start_date=new_start, end_date=new_end)
        
        # Update project manager
        if request.project_manager_id is not None:
            project.assign_project_manager(request.project_manager_id)
        
        # Update team members
        if request.team_members_to_add:
            for member_id in request.team_members_to_add:
                project.add_team_member(member_id)
        
        if request.team_members_to_remove:
            for member_id in request.team_members_to_remove:
                project.remove_team_member(member_id)
        
        # Update tags
        if request.tags_to_add:
            for tag in request.tags_to_add:
                if tag not in project.tags:
                    project.tags.append(tag)
        
        if request.tags_to_remove:
            for tag in request.tags_to_remove:
                if tag in project.tags:
                    project.tags.remove(tag)
        
        # Update custom fields
        if request.custom_fields:
            project.custom_fields.update(request.custom_fields)
        
        project.updated_at = datetime.utcnow()
        project.version += 1
        
        # Save project
        saved_project = await self.project_repository.save(project)
        
        # Publish domain events
        for event in saved_project.domain_events:
            await publish_event(event)
        saved_project.clear_domain_events()
        
        return ProjectResponse.from_domain(saved_project)
    
    async def update_project_status(self, project_id: str, new_status: ProjectStatus, reason: str = None) -> ProjectResponse:
        """Update project status"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        project.update_status(new_status, reason)
        saved_project = await self.project_repository.save(project)
        
        # Publish domain events
        for event in saved_project.domain_events:
            await publish_event(event)
        saved_project.clear_domain_events()
        
        return ProjectResponse.from_domain(saved_project)
    
    async def add_task(self, project_id: str, request: CreateTaskRequest) -> TaskResponse:
        """Add task to project"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        task = Task(
            id=request.id,
            title=request.title,
            description=request.description,
            priority=request.priority or Priority.MEDIUM,
            assignee_id=request.assignee_id,
            estimated_hours=request.estimated_hours,
            due_date=request.due_date,
            dependencies=request.dependencies or [],
            tags=request.tags or []
        )
        
        project.add_task(task)
        saved_project = await self.project_repository.save(project)
        
        # Publish domain events
        for event in saved_project.domain_events:
            await publish_event(event)
        saved_project.clear_domain_events()
        
        return TaskResponse.from_domain(task)
    
    async def update_task(self, project_id: str, task_id: str, request: UpdateTaskRequest) -> TaskResponse:
        """Update task in project"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        # Prepare updates
        updates = {}
        if request.title is not None:
            updates['title'] = request.title
        if request.description is not None:
            updates['description'] = request.description
        if request.status is not None:
            updates['status'] = request.status
        if request.priority is not None:
            updates['priority'] = request.priority
        if request.assignee_id is not None:
            updates['assignee_id'] = request.assignee_id
        if request.estimated_hours is not None:
            updates['estimated_hours'] = request.estimated_hours
        if request.actual_hours is not None:
            updates['actual_hours'] = request.actual_hours
        if request.due_date is not None:
            updates['due_date'] = request.due_date
        if request.dependencies is not None:
            updates['dependencies'] = request.dependencies
        if request.tags is not None:
            updates['tags'] = request.tags
        
        # Mark as completed if status is completed
        if request.status == TaskStatus.COMPLETED:
            updates['completed_date'] = datetime.utcnow()
        
        project.update_task(task_id, updates)
        saved_project = await self.project_repository.save(project)
        
        # Publish domain events
        for event in saved_project.domain_events:
            await publish_event(event)
        saved_project.clear_domain_events()
        
        # Find updated task
        updated_task = next((t for t in saved_project.tasks if t.id == task_id), None)
        if not updated_task:
            raise ValueError(f"Task {task_id} not found after update")
        
        return TaskResponse.from_domain(updated_task)
    
    async def complete_task(self, project_id: str, task_id: str) -> TaskResponse:
        """Mark task as completed"""
        return await self.update_task(project_id, task_id, UpdateTaskRequest(
            status=TaskStatus.COMPLETED
        ))
    
    async def add_milestone(self, project_id: str, request: CreateMilestoneRequest) -> MilestoneResponse:
        """Add milestone to project"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        milestone = Milestone(
            id=request.id,
            name=request.name,
            description=request.description,
            target_date=request.target_date,
            deliverables=request.deliverables or [],
            success_criteria=request.success_criteria or []
        )
        
        project.add_milestone(milestone)
        saved_project = await self.project_repository.save(project)
        
        return MilestoneResponse.from_domain(milestone)
    
    async def complete_milestone(self, project_id: str, milestone_id: str) -> MilestoneResponse:
        """Mark milestone as completed"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        project.complete_milestone(milestone_id)
        saved_project = await self.project_repository.save(project)
        
        # Publish domain events
        for event in saved_project.domain_events:
            await publish_event(event)
        saved_project.clear_domain_events()
        
        # Find completed milestone
        completed_milestone = next((m for m in saved_project.milestones if m.id == milestone_id), None)
        if not completed_milestone:
            raise ValueError(f"Milestone {milestone_id} not found after completion")
        
        return MilestoneResponse.from_domain(completed_milestone)
    
    async def assess_project_risk(self, project_id: str) -> Dict[str, Any]:
        """Assess project risk and provide recommendations"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        risk_score = self.risk_assessment_service.assess_project_risk(project)
        recommendations = self.risk_assessment_service.generate_risk_recommendations(project)
        
        return {
            'project_id': project_id,
            'risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'recommendations': recommendations,
            'assessment_date': datetime.utcnow()
        }
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Convert risk score to risk level"""
        if risk_score >= 0.8:
            return 'CRITICAL'
        elif risk_score >= 0.6:
            return 'HIGH'
        elif risk_score >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    async def get_project_analytics(self, project_id: str) -> ProjectAnalyticsResponse:
        """Get comprehensive project analytics"""
        project = await self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        metrics = project.calculate_metrics()
        risk_assessment = await self.assess_project_risk(project_id)
        critical_path = self.scheduling_service.calculate_critical_path(project)
        reallocation_suggestions = self.scheduling_service.suggest_task_reallocation(project)
        
        return ProjectAnalyticsResponse(
            project_id=project_id,
            metrics=metrics,
            risk_assessment=risk_assessment,
            critical_path_tasks=critical_path,
            task_reallocation_suggestions=reallocation_suggestions,
            next_milestone=project.get_next_milestone(),
            overdue_tasks=[t for t in project.tasks if t.is_overdue()],
            blocked_tasks=[t for t in project.tasks if t.is_blocked()]
        )
    
    async def search_projects(self, request: ProjectSearchRequest) -> PaginationResponse[ProjectResponse]:
        """Search projects with filters"""
        projects = await self.project_repository.search_projects(
            query=request.query,
            client_id=request.client_id,
            project_type=request.project_type,
            status=request.status,
            limit=request.pagination.size,
            offset=request.pagination.offset
        )
        
        project_responses = [ProjectResponse.from_domain(project) for project in projects]
        
        # Get total count (simplified)
        total = len(project_responses)
        
        return PaginationResponse.create(project_responses, total, request.pagination)
    
    async def get_projects_by_client(self, client_id: str) -> List[ProjectResponse]:
        """Get all projects for a client"""
        projects = await self.project_repository.find_by_client_id(client_id)
        return [ProjectResponse.from_domain(project) for project in projects]
    
    async def get_projects_by_manager(self, manager_id: str) -> List[ProjectResponse]:
        """Get all projects managed by a user"""
        projects = await self.project_repository.find_by_project_manager(manager_id)
        return [ProjectResponse.from_domain(project) for project in projects]
    
    async def get_overdue_projects(self) -> List[ProjectResponse]:
        """Get all overdue projects"""
        projects = await self.project_repository.find_overdue_projects()
        return [ProjectResponse.from_domain(project) for project in projects]
    
    async def get_at_risk_projects(self) -> List[ProjectResponse]:
        """Get all at-risk projects"""
        projects = await self.project_repository.find_at_risk_projects()
        return [ProjectResponse.from_domain(project) for project in projects]
    
    async def get_dashboard_summary(self, user_id: str) -> Dict[str, Any]:
        """Get dashboard summary for a user"""
        # Get user's projects (as manager or team member)
        managed_projects = await self.project_repository.find_by_project_manager(user_id)
        team_projects = await self.project_repository.find_by_team_member(user_id)
        
        all_user_projects = list(set(managed_projects + team_projects))
        
        # Calculate summary statistics
        total_projects = len(all_user_projects)
        active_projects = len([p for p in all_user_projects if p.status in [
            ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS, ProjectStatus.TESTING
        ]])
        overdue_projects = len([p for p in all_user_projects if p.is_overdue()])
        at_risk_projects = len([p for p in all_user_projects if p.is_at_risk()])
        
        # Get upcoming milestones
        upcoming_milestones = []
        for project in all_user_projects:
            next_milestone = project.get_next_milestone()
            if next_milestone and next_milestone.target_date <= datetime.utcnow() + timedelta(days=30):
                upcoming_milestones.append({
                    'project_id': project.id,
                    'project_name': project.name,
                    'milestone': MilestoneResponse.from_domain(next_milestone)
                })
        
        # Get user's tasks
        user_tasks = []
        for project in all_user_projects:
            project_tasks = [t for t in project.tasks if t.assignee_id == user_id]
            for task in project_tasks:
                user_tasks.append({
                    'project_id': project.id,
                    'project_name': project.name,
                    'task': TaskResponse.from_domain(task)
                })
        
        overdue_tasks = [t for t in user_tasks if t['task'].is_overdue]
        due_soon_tasks = [t for t in user_tasks 
                         if t['task'].due_date and 
                         t['task'].due_date <= datetime.utcnow() + timedelta(days=7) and
                         not t['task'].is_overdue]
        
        return {
            'user_id': user_id,
            'summary': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'overdue_projects': overdue_projects,
                'at_risk_projects': at_risk_projects,
                'total_tasks': len(user_tasks),
                'overdue_tasks': len(overdue_tasks),
                'due_soon_tasks': len(due_soon_tasks)
            },
            'upcoming_milestones': upcoming_milestones[:5],  # Top 5
            'overdue_tasks': overdue_tasks[:10],  # Top 10
            'due_soon_tasks': due_soon_tasks[:10]  # Top 10
        }
