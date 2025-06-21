"""
Project Management Service API
FastAPI application following hexagonal architecture
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn

from shared.domain import ProjectType, ProjectStatus, PaginationRequest, Money
from ..application.services import ProjectManagementService
from ..application.dtos import (
    CreateProjectRequest, UpdateProjectRequest, ProjectResponse,
    CreateTaskRequest, UpdateTaskRequest, TaskResponse,
    CreateMilestoneRequest, MilestoneResponse,
    ProjectSearchRequest, ProjectAnalyticsResponse
)
from ..domain.services import ProjectRiskAssessmentService, ProjectSchedulingService
from ..domain.models import Priority, TaskStatus
from ..infrastructure.repositories import PostgreSQLProjectRepository, MongoDBProjectReadRepository

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
project_service: Optional[ProjectManagementService] = None
postgres_repo: Optional[PostgreSQLProjectRepository] = None
mongo_repo: Optional[MongoDBProjectReadRepository] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global project_service, postgres_repo, mongo_repo
    
    # Initialize repositories
    postgres_conn = os.getenv("POSTGRES_URL", "postgresql://aicuser:aicpass@localhost:5432/aicsynergy")
    mongo_conn = os.getenv("MONGODB_URL", "mongodb://aicuser:aicpass@localhost:27017")
    
    postgres_repo = PostgreSQLProjectRepository(postgres_conn)
    await postgres_repo.initialize()
    
    mongo_repo = MongoDBProjectReadRepository(mongo_conn)
    await mongo_repo.initialize()
    
    # Initialize services
    risk_assessment_service = ProjectRiskAssessmentService()
    scheduling_service = ProjectSchedulingService()
    
    project_service = ProjectManagementService(
        project_repository=postgres_repo,
        risk_assessment_service=risk_assessment_service,
        scheduling_service=scheduling_service
    )
    
    logger.info("Project Management Service initialized")
    yield
    
    # Cleanup
    if postgres_repo and postgres_repo.pool:
        await postgres_repo.pool.close()
    if mongo_repo and mongo_repo.client:
        mongo_repo.client.close()
    
    logger.info("Project Management Service shutdown")


# Create FastAPI app
app = FastAPI(
    title="AIC Synergy - Project Management Service",
    description="Project management microservice for AIC Synergy platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_project_service() -> ProjectManagementService:
    """Dependency injection for project service"""
    if not project_service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return project_service


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "project-management"}


@app.post("/api/v1/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    request: CreateProjectRequest,
    service: ProjectManagementService = Depends(get_project_service)
):
    """Create a new project"""
    try:
        return await service.create_project(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str = Path(..., description="Project ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Get project by ID"""
    try:
        project = await service.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/v1/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str = Path(..., description="Project ID"),
    request: UpdateProjectRequest = ...,
    service: ProjectManagementService = Depends(get_project_service)
):
    """Update project information"""
    try:
        return await service.update_project(project_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.patch("/api/v1/projects/{project_id}/status", response_model=ProjectResponse)
async def update_project_status(
    project_id: str = Path(..., description="Project ID"),
    new_status: ProjectStatus = Query(..., description="New project status"),
    reason: Optional[str] = Query(None, description="Reason for status change"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Update project status"""
    try:
        return await service.update_project_status(project_id, new_status, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating project status {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/projects/{project_id}/tasks", response_model=TaskResponse, status_code=201)
async def add_task(
    project_id: str = Path(..., description="Project ID"),
    request: CreateTaskRequest = ...,
    service: ProjectManagementService = Depends(get_project_service)
):
    """Add task to project"""
    try:
        return await service.add_task(project_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding task to project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/v1/projects/{project_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: str = Path(..., description="Project ID"),
    task_id: str = Path(..., description="Task ID"),
    request: UpdateTaskRequest = ...,
    service: ProjectManagementService = Depends(get_project_service)
):
    """Update task in project"""
    try:
        return await service.update_task(project_id, task_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating task {task_id} in project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/projects/{project_id}/tasks/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    project_id: str = Path(..., description="Project ID"),
    task_id: str = Path(..., description="Task ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Mark task as completed"""
    try:
        return await service.complete_task(project_id, task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing task {task_id} in project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/projects/{project_id}/milestones", response_model=MilestoneResponse, status_code=201)
async def add_milestone(
    project_id: str = Path(..., description="Project ID"),
    request: CreateMilestoneRequest = ...,
    service: ProjectManagementService = Depends(get_project_service)
):
    """Add milestone to project"""
    try:
        return await service.add_milestone(project_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding milestone to project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/projects/{project_id}/milestones/{milestone_id}/complete", response_model=MilestoneResponse)
async def complete_milestone(
    project_id: str = Path(..., description="Project ID"),
    milestone_id: str = Path(..., description="Milestone ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Mark milestone as completed"""
    try:
        return await service.complete_milestone(project_id, milestone_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing milestone {milestone_id} in project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects/{project_id}/risk-assessment")
async def assess_project_risk(
    project_id: str = Path(..., description="Project ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Assess project risk and provide recommendations"""
    try:
        return await service.assess_project_risk(project_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error assessing risk for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects/{project_id}/analytics", response_model=ProjectAnalyticsResponse)
async def get_project_analytics(
    project_id: str = Path(..., description="Project ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Get comprehensive project analytics"""
    try:
        return await service.get_project_analytics(project_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting analytics for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects", response_model=List[ProjectResponse])
async def search_projects(
    query: str = Query("", description="Search query"),
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    project_type: Optional[ProjectType] = Query(None, description="Filter by project type"),
    status: Optional[ProjectStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Search projects with filters"""
    try:
        search_request = ProjectSearchRequest(
            query=query,
            client_id=client_id,
            project_type=project_type,
            status=status,
            pagination=PaginationRequest(page=page, size=size)
        )
        result = await service.search_projects(search_request)
        return result.items
    except Exception as e:
        logger.error(f"Error searching projects: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects/by-client/{client_id}", response_model=List[ProjectResponse])
async def get_projects_by_client(
    client_id: str = Path(..., description="Client ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Get all projects for a client"""
    try:
        return await service.get_projects_by_client(client_id)
    except Exception as e:
        logger.error(f"Error getting projects for client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects/by-manager/{manager_id}", response_model=List[ProjectResponse])
async def get_projects_by_manager(
    manager_id: str = Path(..., description="Manager ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Get all projects managed by a user"""
    try:
        return await service.get_projects_by_manager(manager_id)
    except Exception as e:
        logger.error(f"Error getting projects for manager {manager_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects/overdue", response_model=List[ProjectResponse])
async def get_overdue_projects(
    service: ProjectManagementService = Depends(get_project_service)
):
    """Get all overdue projects"""
    try:
        return await service.get_overdue_projects()
    except Exception as e:
        logger.error(f"Error getting overdue projects: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/projects/at-risk", response_model=List[ProjectResponse])
async def get_at_risk_projects(
    service: ProjectManagementService = Depends(get_project_service)
):
    """Get all at-risk projects"""
    try:
        return await service.get_at_risk_projects()
    except Exception as e:
        logger.error(f"Error getting at-risk projects: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/dashboard/projects")
async def get_dashboard_projects(
    user_id: str = Query(..., description="User ID"),
    status: Optional[ProjectStatus] = Query(None),
    project_type: Optional[ProjectType] = Query(None),
    client_id: Optional[str] = Query(None)
):
    """Get projects optimized for dashboard display"""
    try:
        if not mongo_repo:
            raise HTTPException(status_code=500, detail="Read repository not available")
        
        filters = {}
        if status:
            filters['status'] = status.value
        if project_type:
            filters['project_type'] = project_type.value
        if client_id:
            filters['client_id'] = client_id
        
        projects = await mongo_repo.find_projects_for_dashboard(user_id, filters)
        return projects
    except Exception as e:
        logger.error(f"Error getting dashboard projects: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/dashboard/summary/{user_id}")
async def get_dashboard_summary(
    user_id: str = Path(..., description="User ID"),
    service: ProjectManagementService = Depends(get_project_service)
):
    """Get dashboard summary for a user"""
    try:
        return await service.get_dashboard_summary(user_id)
    except Exception as e:
        logger.error(f"Error getting dashboard summary for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/analytics/projects")
async def get_project_analytics_summary(
    user_id: Optional[str] = Query(None, description="Filter by user ID")
):
    """Get project analytics data"""
    try:
        if not mongo_repo:
            raise HTTPException(status_code=500, detail="Read repository not available")
        
        analytics = await mongo_repo.get_project_analytics(user_id)
        type_distribution = await mongo_repo.get_project_type_distribution()
        
        return {
            "summary": analytics,
            "type_distribution": type_distribution
        }
    except Exception as e:
        logger.error(f"Error getting project analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
