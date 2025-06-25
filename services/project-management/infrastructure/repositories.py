"""
Project Management Infrastructure - Repository Implementations
"""
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncpg
import motor.motor_asyncio
from shared.domain import ProjectType, ProjectStatus
from ..domain.models import Project, Task, Milestone, ProjectRisk, Priority, TaskStatus, TimeRange, Money
from ..domain.repositories import ProjectRepository


class PostgreSQLProjectRepository(ProjectRepository):
    """PostgreSQL implementation of ProjectRepository (Write side - CQRS)"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
        await self._create_tables()
    
    async def _create_tables(self):
        """Create necessary tables"""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    client_id VARCHAR(36) NOT NULL,
                    project_type VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'Discovery',
                    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
                    budget_amount DECIMAL(15,2) NOT NULL,
                    budget_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
                    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    estimated_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    project_manager_id VARCHAR(36),
                    team_members TEXT[] DEFAULT '{}',
                    tasks JSONB DEFAULT '[]',
                    milestones JSONB DEFAULT '[]',
                    risks JSONB DEFAULT '[]',
                    tags TEXT[] DEFAULT '{}',
                    custom_fields JSONB DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
                CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
                CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
                CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);
                CREATE INDEX IF NOT EXISTS idx_projects_team_members ON projects USING GIN(team_members);
                CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);
                CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, estimated_end_date);
            """)
    
    async def get_by_id(self, id: str) -> Optional[Project]:
        """Get project by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM projects WHERE id = $1", id
            )
            return self._row_to_project(row) if row else None
    
    async def save(self, project: Project) -> Project:
        """Save project"""
        async with self.pool.acquire() as conn:
            # Check if project exists
            existing = await conn.fetchrow(
                "SELECT version FROM projects WHERE id = $1", project.id
            )
            
            if existing:
                # Update existing project
                if existing['version'] != project.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE projects SET
                        name = $2,
                        description = $3,
                        client_id = $4,
                        project_type = $5,
                        status = $6,
                        priority = $7,
                        budget_amount = $8,
                        budget_currency = $9,
                        start_date = $10,
                        estimated_end_date = $11,
                        project_manager_id = $12,
                        team_members = $13,
                        tasks = $14,
                        milestones = $15,
                        risks = $16,
                        tags = $17,
                        custom_fields = $18,
                        updated_at = $19,
                        version = $20
                    WHERE id = $1
                """, 
                    project.id,
                    project.name,
                    project.description,
                    project.client_id,
                    project.project_type.value,
                    project.status.value,
                    project.priority.value,
                    project.budget.amount,
                    project.budget.currency,
                    project.time_range.start_date,
                    project.time_range.end_date,
                    project.project_manager_id,
                    project.team_members,
                    json.dumps([task.dict() for task in project.tasks]),
                    json.dumps([milestone.dict() for milestone in project.milestones]),
                    json.dumps([risk.dict() for risk in project.risks]),
                    project.tags,
                    json.dumps(project.custom_fields),
                    project.updated_at,
                    project.version
                )
            else:
                # Insert new project
                await conn.execute("""
                    INSERT INTO projects (
                        id, name, description, client_id, project_type, status, priority,
                        budget_amount, budget_currency, start_date, estimated_end_date,
                        project_manager_id, team_members, tasks, milestones, risks,
                        tags, custom_fields, created_at, updated_at, version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                """,
                    project.id,
                    project.name,
                    project.description,
                    project.client_id,
                    project.project_type.value,
                    project.status.value,
                    project.priority.value,
                    project.budget.amount,
                    project.budget.currency,
                    project.time_range.start_date,
                    project.time_range.end_date,
                    project.project_manager_id,
                    project.team_members,
                    json.dumps([task.dict() for task in project.tasks]),
                    json.dumps([milestone.dict() for milestone in project.milestones]),
                    json.dumps([risk.dict() for risk in project.risks]),
                    project.tags,
                    json.dumps(project.custom_fields),
                    project.created_at,
                    project.updated_at,
                    project.version
                )
        
        return project
    
    async def delete(self, id: str) -> bool:
        """Delete project (soft delete by setting status to cancelled)"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE projects SET status = 'Cancelled', updated_at = NOW() WHERE id = $1",
                id
            )
            return result == "UPDATE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[Project]:
        """Find all projects"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_project(row) for row in rows]
    
    async def find_by_client_id(self, client_id: str) -> List[Project]:
        """Find projects by client ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM projects WHERE client_id = $1 ORDER BY created_at DESC",
                client_id
            )
            return [self._row_to_project(row) for row in rows]
    
    async def find_by_project_manager(self, manager_id: str) -> List[Project]:
        """Find projects by project manager"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM projects WHERE project_manager_id = $1 ORDER BY created_at DESC",
                manager_id
            )
            return [self._row_to_project(row) for row in rows]
    
    async def find_by_status(self, status: ProjectStatus) -> List[Project]:
        """Find projects by status"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC",
                status.value
            )
            return [self._row_to_project(row) for row in rows]
    
    async def find_by_type(self, project_type: ProjectType) -> List[Project]:
        """Find projects by type"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM projects WHERE project_type = $1 ORDER BY created_at DESC",
                project_type.value
            )
            return [self._row_to_project(row) for row in rows]
    
    async def find_active_projects(self) -> List[Project]:
        """Find all active projects"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM projects 
                WHERE status IN ('Planning', 'In_Progress', 'Testing', 'Deployment')
                ORDER BY created_at DESC
            """)
            return [self._row_to_project(row) for row in rows]
    
    async def find_overdue_projects(self) -> List[Project]:
        """Find overdue projects"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM projects 
                WHERE status NOT IN ('Completed', 'Cancelled') 
                AND estimated_end_date < NOW()
                ORDER BY estimated_end_date ASC
            """)
            return [self._row_to_project(row) for row in rows]
    
    async def find_at_risk_projects(self) -> List[Project]:
        """Find projects at risk (simplified - would use more complex logic in production)"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM projects 
                WHERE status IN ('Planning', 'In_Progress', 'Testing')
                AND (
                    estimated_end_date < NOW() + INTERVAL '30 days'
                    OR jsonb_array_length(risks) > 0
                )
                ORDER BY estimated_end_date ASC
            """)
            return [self._row_to_project(row) for row in rows]
    
    async def find_by_team_member(self, user_id: str) -> List[Project]:
        """Find projects where user is a team member"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM projects WHERE $1 = ANY(team_members) ORDER BY created_at DESC",
                user_id
            )
            return [self._row_to_project(row) for row in rows]
    
    async def find_projects_ending_soon(self, days: int = 30) -> List[Project]:
        """Find projects ending within specified days"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM projects 
                WHERE status NOT IN ('Completed', 'Cancelled')
                AND estimated_end_date BETWEEN NOW() AND NOW() + INTERVAL '%s days'
                ORDER BY estimated_end_date ASC
            """ % days)
            return [self._row_to_project(row) for row in rows]
    
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
        conditions = []
        params = []
        param_count = 0
        
        if query:
            param_count += 1
            conditions.append(f"(name ILIKE ${param_count} OR description ILIKE ${param_count})")
            params.append(f"%{query}%")
        
        if client_id:
            param_count += 1
            conditions.append(f"client_id = ${param_count}")
            params.append(client_id)
        
        if project_type:
            param_count += 1
            conditions.append(f"project_type = ${param_count}")
            params.append(project_type.value)
        
        if status:
            param_count += 1
            conditions.append(f"status = ${param_count}")
            params.append(status.value)
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        param_count += 1
        params.append(limit)
        param_count += 1
        params.append(offset)
        
        sql = f"""
            SELECT * FROM projects 
            WHERE {where_clause}
            ORDER BY created_at DESC 
            LIMIT ${param_count-1} OFFSET ${param_count}
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
            return [self._row_to_project(row) for row in rows]
    
    async def get_project_statistics(self) -> dict:
        """Get project statistics"""
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_projects,
                    COUNT(CASE WHEN status IN ('Planning', 'In_Progress', 'Testing') THEN 1 END) as active_projects,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_projects,
                    COUNT(CASE WHEN status NOT IN ('Completed', 'Cancelled') AND estimated_end_date < NOW() THEN 1 END) as overdue_projects,
                    AVG(budget_amount) as avg_budget
                FROM projects
            """)
            
            type_stats = await conn.fetch("""
                SELECT project_type, COUNT(*) as count 
                FROM projects 
                GROUP BY project_type
            """)
            
            return {
                'total_projects': stats['total_projects'],
                'active_projects': stats['active_projects'],
                'completed_projects': stats['completed_projects'],
                'overdue_projects': stats['overdue_projects'],
                'average_budget': float(stats['avg_budget']) if stats['avg_budget'] else 0,
                'projects_by_type': {row['project_type']: row['count'] for row in type_stats}
            }
    
    def _row_to_project(self, row) -> Project:
        """Convert database row to Project domain model"""
        if not row:
            return None
        
        # Parse tasks
        tasks_data = json.loads(row['tasks']) if row['tasks'] else []
        tasks = [Task(**task_data) for task_data in tasks_data]
        
        # Parse milestones
        milestones_data = json.loads(row['milestones']) if row['milestones'] else []
        milestones = [Milestone(**milestone_data) for milestone_data in milestones_data]
        
        # Parse risks
        risks_data = json.loads(row['risks']) if row['risks'] else []
        risks = [ProjectRisk(**risk_data) for risk_data in risks_data]
        
        # Create time range
        time_range = TimeRange(
            start_date=row['start_date'],
            end_date=row['estimated_end_date']
        )
        
        # Create budget
        budget = Money(
            amount=float(row['budget_amount']),
            currency=row['budget_currency']
        )
        
        # Parse custom fields
        custom_fields = json.loads(row['custom_fields']) if row['custom_fields'] else {}
        
        # Create project
        project = Project(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            client_id=row['client_id'],
            project_type=ProjectType(row['project_type']),
            status=ProjectStatus(row['status']),
            priority=Priority(row['priority']),
            budget=budget,
            time_range=time_range,
            project_manager_id=row['project_manager_id'],
            team_members=list(row['team_members']) if row['team_members'] else [],
            tasks=tasks,
            milestones=milestones,
            risks=risks,
            tags=list(row['tags']) if row['tags'] else [],
            custom_fields=custom_fields,
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return project


class MongoDBProjectReadRepository:
    """MongoDB implementation for read-side queries (CQRS)"""
    
    def __init__(self, connection_string: str, database_name: str = "aicsynergy"):
        self.connection_string = connection_string
        self.database_name = database_name
        self.client = None
        self.db = None
        self.collection = None
    
    async def initialize(self):
        """Initialize MongoDB connection"""
        self.client = motor.motor_asyncio.AsyncIOMotorClient(self.connection_string)
        self.db = self.client[self.database_name]
        self.collection = self.db.projects
        
        # Create indexes
        await self.collection.create_index("client_id")
        await self.collection.create_index("project_manager_id")
        await self.collection.create_index("status")
        await self.collection.create_index("project_type")
        await self.collection.create_index("team_members")
        await self.collection.create_index([("name", "text"), ("description", "text")])
    
    async def find_projects_for_dashboard(self, user_id: str, filters: Dict[str, Any] = None) -> List[Dict]:
        """Find projects optimized for dashboard display"""
        pipeline = []
        
        # Match user's projects (as manager or team member)
        match_conditions = {
            "$or": [
                {"project_manager_id": user_id},
                {"team_members": user_id}
            ]
        }
        
        # Apply additional filters
        if filters:
            if filters.get('status'):
                match_conditions['status'] = filters['status']
            if filters.get('project_type'):
                match_conditions['project_type'] = filters['project_type']
            if filters.get('client_id'):
                match_conditions['client_id'] = filters['client_id']
        
        pipeline.append({"$match": match_conditions})
        
        # Project only needed fields for dashboard
        pipeline.append({
            "$project": {
                "name": 1,
                "client_id": 1,
                "project_type": 1,
                "status": 1,
                "priority": 1,
                "budget": 1,
                "time_range": 1,
                "team_members": 1,
                "tasks": 1,
                "milestones": 1,
                "created_at": 1,
                "updated_at": 1
            }
        })
        
        # Add computed fields
        pipeline.append({
            "$addFields": {
                "completion_percentage": {
                    "$cond": {
                        "if": {"$gt": [{"$size": "$tasks"}, 0]},
                        "then": {
                            "$multiply": [
                                {"$divide": [
                                    {"$size": {"$filter": {
                                        "input": "$tasks",
                                        "cond": {"$eq": ["$$this.status", "Completed"]}
                                    }}},
                                    {"$size": "$tasks"}
                                ]},
                                100
                            ]
                        },
                        "else": 0
                    }
                },
                "is_overdue": {
                    "$and": [
                        {"$not": {"$in": ["$status", ["Completed", "Cancelled"]]}},
                        {"$lt": ["$time_range.end_date", "$$NOW"]}
                    ]
                }
            }
        })
        
        # Sort by priority and creation date
        pipeline.append({"$sort": {"priority": -1, "created_at": -1}})
        
        # Limit results
        pipeline.append({"$limit": 50})
        
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)
    
    async def get_project_analytics(self, user_id: str = None) -> Dict[str, Any]:
        """Get project analytics data"""
        match_stage = {}
        if user_id:
            match_stage = {
                "$or": [
                    {"project_manager_id": user_id},
                    {"team_members": user_id}
                ]
            }
        
        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})
        
        pipeline.extend([
            {
                "$group": {
                    "_id": None,
                    "total_projects": {"$sum": 1},
                    "active_projects": {
                        "$sum": {"$cond": [
                            {"$in": ["$status", ["Planning", "In_Progress", "Testing"]]}, 1, 0
                        ]}
                    },
                    "completed_projects": {
                        "$sum": {"$cond": [{"$eq": ["$status", "Completed"]}, 1, 0]}
                    },
                    "overdue_projects": {
                        "$sum": {"$cond": [
                            {"$and": [
                                {"$not": {"$in": ["$status", ["Completed", "Cancelled"]]}},
                                {"$lt": ["$time_range.end_date", "$$NOW"]}
                            ]}, 1, 0
                        ]}
                    },
                    "avg_budget": {"$avg": "$budget.amount"}
                }
            }
        ])
        
        result = await self.collection.aggregate(pipeline).to_list(length=1)
        if result:
            return result[0]
        return {}
    
    async def get_project_type_distribution(self) -> List[Dict]:
        """Get distribution of projects by type"""
        pipeline = [
            {
                "$group": {
                    "_id": "$project_type",
                    "count": {"$sum": 1},
                    "avg_budget": {"$avg": "$budget.amount"},
                    "completion_rate": {
                        "$avg": {
                            "$cond": {
                                "if": {"$gt": [{"$size": "$tasks"}, 0]},
                                "then": {
                                    "$divide": [
                                        {"$size": {"$filter": {
                                            "input": "$tasks",
                                            "cond": {"$eq": ["$$this.status", "Completed"]}
                                        }}},
                                        {"$size": "$tasks"}
                                    ]
                                },
                                "else": 0
                            }
                        }
                    }
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)
