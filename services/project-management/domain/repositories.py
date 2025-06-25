"""
Project Management Repository Interfaces
"""
from abc import abstractmethod
from typing import List, Optional
from datetime import datetime
from shared.domain import Repository, ProjectType, ProjectStatus
from .models import Project, Task, Priority, TaskStatus


class ProjectRepository(Repository[Project]):
    """Project repository interface"""
    
    @abstractmethod
    async def find_by_client_id(self, client_id: str) -> List[Project]:
        """Find projects by client ID"""
        pass
    
    @abstractmethod
    async def find_by_project_manager(self, manager_id: str) -> List[Project]:
        """Find projects by project manager"""
        pass
    
    @abstractmethod
    async def find_by_status(self, status: ProjectStatus) -> List[Project]:
        """Find projects by status"""
        pass
    
    @abstractmethod
    async def find_by_type(self, project_type: ProjectType) -> List[Project]:
        """Find projects by type"""
        pass
    
    @abstractmethod
    async def find_active_projects(self) -> List[Project]:
        """Find all active projects"""
        pass
    
    @abstractmethod
    async def find_overdue_projects(self) -> List[Project]:
        """Find overdue projects"""
        pass
    
    @abstractmethod
    async def find_at_risk_projects(self) -> List[Project]:
        """Find projects at risk"""
        pass
    
    @abstractmethod
    async def find_by_team_member(self, user_id: str) -> List[Project]:
        """Find projects where user is a team member"""
        pass
    
    @abstractmethod
    async def find_projects_ending_soon(self, days: int = 30) -> List[Project]:
        """Find projects ending within specified days"""
        pass
    
    @abstractmethod
    async def search_projects(
        self,
        query: str,
        client_id: Optional[str] = None,
        project_type: Optional[ProjectType] = None,
        status: Optional[ProjectStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Project]:
        """Search projects with filters"""
        pass
    
    @abstractmethod
    async def get_project_statistics(self) -> dict:
        """Get project statistics"""
        pass


class TaskRepository(Repository[Task]):
    """Task repository interface (if tasks are managed separately)"""
    
    @abstractmethod
    async def find_by_project_id(self, project_id: str) -> List[Task]:
        """Find tasks by project ID"""
        pass
    
    @abstractmethod
    async def find_by_assignee(self, assignee_id: str) -> List[Task]:
        """Find tasks by assignee"""
        pass
    
    @abstractmethod
    async def find_by_status(self, status: TaskStatus) -> List[Task]:
        """Find tasks by status"""
        pass
    
    @abstractmethod
    async def find_overdue_tasks(self) -> List[Task]:
        """Find overdue tasks"""
        pass
    
    @abstractmethod
    async def find_tasks_due_soon(self, days: int = 7) -> List[Task]:
        """Find tasks due within specified days"""
        pass
    
    @abstractmethod
    async def find_by_priority(self, priority: Priority) -> List[Task]:
        """Find tasks by priority"""
        pass
    
    @abstractmethod
    async def find_blocked_tasks(self) -> List[Task]:
        """Find blocked tasks"""
        pass
    
    @abstractmethod
    async def search_tasks(
        self,
        query: str,
        project_id: Optional[str] = None,
        assignee_id: Optional[str] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[Priority] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Task]:
        """Search tasks with filters"""
        pass
