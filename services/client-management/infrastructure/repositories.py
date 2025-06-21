"""
Client Management Infrastructure - Repository Implementations
"""
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncpg
import motor.motor_asyncio
from pymongo import MongoClient
from shared.domain import ClientType
from ..domain.models import Client, ClientProfile, ClientPreferences
from ..domain.repositories import ClientRepository
from shared.domain import ContactInfo, Address, Money


class PostgreSQLClientRepository(ClientRepository):
    """PostgreSQL implementation of ClientRepository (Write side - CQRS)"""
    
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
                CREATE TABLE IF NOT EXISTS clients (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    client_type VARCHAR(20) NOT NULL,
                    contact_email VARCHAR(255) NOT NULL UNIQUE,
                    contact_phone VARCHAR(50),
                    contact_address JSONB,
                    profile JSONB NOT NULL DEFAULT '{}',
                    preferences JSONB NOT NULL DEFAULT '{}',
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    lead_score INTEGER,
                    acquisition_source VARCHAR(100),
                    assigned_account_manager VARCHAR(36),
                    tags TEXT[] DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(contact_email);
                CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
                CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);
                CREATE INDEX IF NOT EXISTS idx_clients_lead_score ON clients(lead_score);
                CREATE INDEX IF NOT EXISTS idx_clients_account_manager ON clients(assigned_account_manager);
                CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);
            """)
    
    async def get_by_id(self, id: str) -> Optional[Client]:
        """Get client by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM clients WHERE id = $1", id
            )
            return self._row_to_client(row) if row else None
    
    async def save(self, client: Client) -> Client:
        """Save client"""
        async with self.pool.acquire() as conn:
            # Check if client exists
            existing = await conn.fetchrow(
                "SELECT version FROM clients WHERE id = $1", client.id
            )
            
            if existing:
                # Update existing client
                if existing['version'] != client.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE clients SET
                        name = $2,
                        client_type = $3,
                        contact_email = $4,
                        contact_phone = $5,
                        contact_address = $6,
                        profile = $7,
                        preferences = $8,
                        is_active = $9,
                        lead_score = $10,
                        acquisition_source = $11,
                        assigned_account_manager = $12,
                        tags = $13,
                        updated_at = $14,
                        version = $15
                    WHERE id = $1
                """, 
                    client.id,
                    client.name,
                    client.client_type.value,
                    client.contact_info.email,
                    client.contact_info.phone,
                    json.dumps(client.contact_info.address.dict()) if client.contact_info.address else None,
                    json.dumps(client.profile.dict()),
                    json.dumps(client.preferences.dict()),
                    client.is_active,
                    client.lead_score,
                    client.acquisition_source,
                    client.assigned_account_manager,
                    client.tags,
                    client.updated_at,
                    client.version
                )
            else:
                # Insert new client
                await conn.execute("""
                    INSERT INTO clients (
                        id, name, client_type, contact_email, contact_phone, contact_address,
                        profile, preferences, is_active, lead_score, acquisition_source,
                        assigned_account_manager, tags, created_at, updated_at, version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                """,
                    client.id,
                    client.name,
                    client.client_type.value,
                    client.contact_info.email,
                    client.contact_info.phone,
                    json.dumps(client.contact_info.address.dict()) if client.contact_info.address else None,
                    json.dumps(client.profile.dict()),
                    json.dumps(client.preferences.dict()),
                    client.is_active,
                    client.lead_score,
                    client.acquisition_source,
                    client.assigned_account_manager,
                    client.tags,
                    client.created_at,
                    client.updated_at,
                    client.version
                )
        
        return client
    
    async def delete(self, id: str) -> bool:
        """Delete client (soft delete by deactivating)"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE clients SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
                id
            )
            return result == "UPDATE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[Client]:
        """Find all clients"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM clients ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_client(row) for row in rows]
    
    async def find_by_email(self, email: str) -> Optional[Client]:
        """Find client by email"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM clients WHERE contact_email = $1", email
            )
            return self._row_to_client(row) if row else None
    
    async def find_by_type(self, client_type: ClientType) -> List[Client]:
        """Find clients by type"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM clients WHERE client_type = $1 ORDER BY created_at DESC",
                client_type.value
            )
            return [self._row_to_client(row) for row in rows]
    
    async def find_by_account_manager(self, manager_id: str) -> List[Client]:
        """Find clients by account manager"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM clients WHERE assigned_account_manager = $1 ORDER BY created_at DESC",
                manager_id
            )
            return [self._row_to_client(row) for row in rows]
    
    async def find_by_tag(self, tag: str) -> List[Client]:
        """Find clients with specific tag"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM clients WHERE $1 = ANY(tags) ORDER BY created_at DESC",
                tag
            )
            return [self._row_to_client(row) for row in rows]
    
    async def find_active_clients(self) -> List[Client]:
        """Find all active clients"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM clients WHERE is_active = TRUE ORDER BY created_at DESC"
            )
            return [self._row_to_client(row) for row in rows]
    
    async def find_high_value_clients(self, min_score: int = 80) -> List[Client]:
        """Find high value clients"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM clients WHERE lead_score >= $1 ORDER BY lead_score DESC",
                min_score
            )
            return [self._row_to_client(row) for row in rows]
    
    async def search_clients(
        self,
        query: str,
        client_type: Optional[ClientType] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Client]:
        """Search clients with filters"""
        conditions = []
        params = []
        param_count = 0
        
        if query:
            param_count += 1
            conditions.append(f"(name ILIKE ${param_count} OR contact_email ILIKE ${param_count})")
            params.append(f"%{query}%")
        
        if client_type:
            param_count += 1
            conditions.append(f"client_type = ${param_count}")
            params.append(client_type.value)
        
        if is_active is not None:
            param_count += 1
            conditions.append(f"is_active = ${param_count}")
            params.append(is_active)
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        param_count += 1
        params.append(limit)
        param_count += 1
        params.append(offset)
        
        sql = f"""
            SELECT * FROM clients 
            WHERE {where_clause}
            ORDER BY created_at DESC 
            LIMIT ${param_count-1} OFFSET ${param_count}
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
            return [self._row_to_client(row) for row in rows]
    
    async def get_client_count_by_type(self) -> dict:
        """Get count of clients by type"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT client_type, COUNT(*) as count FROM clients GROUP BY client_type"
            )
            return {row['client_type']: row['count'] for row in rows}
    
    def _row_to_client(self, row) -> Client:
        """Convert database row to Client domain model"""
        if not row:
            return None
        
        # Parse contact info
        address = None
        if row['contact_address']:
            addr_data = json.loads(row['contact_address'])
            address = Address(**addr_data)
        
        contact_info = ContactInfo(
            email=row['contact_email'],
            phone=row['contact_phone'],
            address=address
        )
        
        # Parse profile
        profile_data = json.loads(row['profile'])
        if 'annual_revenue' in profile_data and profile_data['annual_revenue']:
            profile_data['annual_revenue'] = Money(**profile_data['annual_revenue'])
        profile = ClientProfile(**profile_data)
        
        # Parse preferences
        preferences_data = json.loads(row['preferences'])
        preferences = ClientPreferences(**preferences_data)
        
        # Create client
        client = Client(
            id=row['id'],
            name=row['name'],
            client_type=ClientType(row['client_type']),
            contact_info=contact_info,
            profile=profile,
            preferences=preferences,
            is_active=row['is_active'],
            lead_score=row['lead_score'],
            acquisition_source=row['acquisition_source'],
            assigned_account_manager=row['assigned_account_manager'],
            tags=list(row['tags']) if row['tags'] else [],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return client


class MongoDBClientReadRepository:
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
        self.collection = self.db.clients
        
        # Create indexes
        await self.collection.create_index("contact_info.email", unique=True)
        await self.collection.create_index("client_type")
        await self.collection.create_index("is_active")
        await self.collection.create_index("lead_score")
        await self.collection.create_index("tags")
        await self.collection.create_index([("name", "text"), ("contact_info.email", "text")])
    
    async def find_clients_for_dashboard(self, user_id: str, filters: Dict[str, Any] = None) -> List[Dict]:
        """Find clients optimized for dashboard display"""
        pipeline = []
        
        # Match filters
        match_conditions = {"is_active": True}
        if filters:
            if filters.get('client_type'):
                match_conditions['client_type'] = filters['client_type']
            if filters.get('min_lead_score'):
                match_conditions['lead_score'] = {"$gte": filters['min_lead_score']}
            if filters.get('tags'):
                match_conditions['tags'] = {"$in": filters['tags']}
        
        pipeline.append({"$match": match_conditions})
        
        # Project only needed fields for dashboard
        pipeline.append({
            "$project": {
                "name": 1,
                "client_type": 1,
                "contact_info.email": 1,
                "lead_score": 1,
                "tags": 1,
                "created_at": 1,
                "updated_at": 1,
                "assigned_account_manager": 1
            }
        })
        
        # Sort by lead score and creation date
        pipeline.append({"$sort": {"lead_score": -1, "created_at": -1}})
        
        # Limit results
        pipeline.append({"$limit": 50})
        
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)
    
    async def get_client_analytics(self) -> Dict[str, Any]:
        """Get client analytics data"""
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_clients": {"$sum": 1},
                    "active_clients": {
                        "$sum": {"$cond": [{"$eq": ["$is_active", True]}, 1, 0]}
                    },
                    "avg_lead_score": {"$avg": "$lead_score"},
                    "high_value_clients": {
                        "$sum": {"$cond": [{"$gte": ["$lead_score", 80]}, 1, 0]}
                    }
                }
            }
        ]
        
        result = await self.collection.aggregate(pipeline).to_list(length=1)
        if result:
            return result[0]
        return {}
    
    async def get_client_type_distribution(self) -> List[Dict]:
        """Get distribution of clients by type"""
        pipeline = [
            {
                "$group": {
                    "_id": "$client_type",
                    "count": {"$sum": 1},
                    "avg_lead_score": {"$avg": "$lead_score"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)
