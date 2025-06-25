"""
Nextcloud Integration Infrastructure - Repository Implementations
"""
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncpg
from ..domain.models import (
    NextcloudDocument, DocumentFolder, DocumentType, DocumentStatus,
    DocumentMetadata, DocumentVersion, DocumentShare, SharePermission
)
from ..domain.repositories import NextcloudDocumentRepository, DocumentFolderRepository


class PostgreSQLDocumentRepository(NextcloudDocumentRepository):
    """PostgreSQL implementation of NextcloudDocumentRepository"""
    
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
                CREATE TABLE IF NOT EXISTS nextcloud_documents (
                    id VARCHAR(36) PRIMARY KEY,
                    nextcloud_file_id VARCHAR(100) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    client_id VARCHAR(36) NOT NULL,
                    project_id VARCHAR(36),
                    owner_id VARCHAR(36) NOT NULL,
                    metadata JSONB NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'Draft',
                    current_version VARCHAR(20) NOT NULL DEFAULT '1.0',
                    versions JSONB DEFAULT '[]',
                    shares JSONB DEFAULT '[]',
                    file_size BIGINT NOT NULL,
                    mime_type VARCHAR(100) NOT NULL,
                    checksum VARCHAR(64),
                    last_accessed TIMESTAMP WITH TIME ZONE,
                    download_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_client_id ON nextcloud_documents(client_id);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_project_id ON nextcloud_documents(project_id);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_owner_id ON nextcloud_documents(owner_id);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_file_id ON nextcloud_documents(nextcloud_file_id);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_status ON nextcloud_documents(status);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_type ON nextcloud_documents((metadata->>'document_type'));
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_tags ON nextcloud_documents USING GIN((metadata->'tags'));
                CREATE INDEX IF NOT EXISTS idx_nextcloud_docs_last_accessed ON nextcloud_documents(last_accessed);
                
                CREATE TABLE IF NOT EXISTS nextcloud_folders (
                    id VARCHAR(36) PRIMARY KEY,
                    nextcloud_folder_id VARCHAR(100) NOT NULL,
                    folder_name VARCHAR(255) NOT NULL,
                    folder_path VARCHAR(500) NOT NULL,
                    parent_folder_id VARCHAR(36),
                    client_id VARCHAR(36) NOT NULL,
                    project_id VARCHAR(36),
                    owner_id VARCHAR(36) NOT NULL,
                    permissions JSONB DEFAULT '{}',
                    is_shared BOOLEAN DEFAULT FALSE,
                    document_count INTEGER DEFAULT 0,
                    subfolder_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_nextcloud_folders_client_id ON nextcloud_folders(client_id);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_folders_project_id ON nextcloud_folders(project_id);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_folders_parent ON nextcloud_folders(parent_folder_id);
                CREATE INDEX IF NOT EXISTS idx_nextcloud_folders_nc_id ON nextcloud_folders(nextcloud_folder_id);
            """)
    
    async def get_by_id(self, id: str) -> Optional[NextcloudDocument]:
        """Get document by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM nextcloud_documents WHERE id = $1", id
            )
            return self._row_to_document(row) if row else None
    
    async def save(self, document: NextcloudDocument) -> NextcloudDocument:
        """Save document"""
        async with self.pool.acquire() as conn:
            # Check if document exists
            existing = await conn.fetchrow(
                "SELECT version FROM nextcloud_documents WHERE id = $1", document.id
            )
            
            if existing:
                # Update existing document
                if existing['version'] != document.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE nextcloud_documents SET
                        nextcloud_file_id = $2,
                        file_name = $3,
                        file_path = $4,
                        client_id = $5,
                        project_id = $6,
                        owner_id = $7,
                        metadata = $8,
                        status = $9,
                        current_version = $10,
                        versions = $11,
                        shares = $12,
                        file_size = $13,
                        mime_type = $14,
                        checksum = $15,
                        last_accessed = $16,
                        download_count = $17,
                        updated_at = $18,
                        version = $19
                    WHERE id = $1
                """, 
                    document.id,
                    document.nextcloud_file_id,
                    document.file_name,
                    document.file_path,
                    document.client_id,
                    document.project_id,
                    document.owner_id,
                    json.dumps(document.metadata.dict()),
                    document.status.value,
                    document.current_version,
                    json.dumps([v.dict() for v in document.versions]),
                    json.dumps([s.dict() for s in document.shares]),
                    document.file_size,
                    document.mime_type,
                    document.checksum,
                    document.last_accessed,
                    document.download_count,
                    document.updated_at,
                    document.version
                )
            else:
                # Insert new document
                await conn.execute("""
                    INSERT INTO nextcloud_documents (
                        id, nextcloud_file_id, file_name, file_path, client_id, project_id,
                        owner_id, metadata, status, current_version, versions, shares,
                        file_size, mime_type, checksum, last_accessed, download_count,
                        created_at, updated_at, version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                """,
                    document.id,
                    document.nextcloud_file_id,
                    document.file_name,
                    document.file_path,
                    document.client_id,
                    document.project_id,
                    document.owner_id,
                    json.dumps(document.metadata.dict()),
                    document.status.value,
                    document.current_version,
                    json.dumps([v.dict() for v in document.versions]),
                    json.dumps([s.dict() for s in document.shares]),
                    document.file_size,
                    document.mime_type,
                    document.checksum,
                    document.last_accessed,
                    document.download_count,
                    document.created_at,
                    document.updated_at,
                    document.version
                )
        
        return document
    
    async def delete(self, id: str) -> bool:
        """Delete document (soft delete by archiving)"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE nextcloud_documents SET status = 'Archived', updated_at = NOW() WHERE id = $1",
                id
            )
            return result == "UPDATE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[NextcloudDocument]:
        """Find all documents"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_documents ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_document(row) for row in rows]
    
    async def find_by_client_id(self, client_id: str) -> List[NextcloudDocument]:
        """Find documents by client ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_documents WHERE client_id = $1 ORDER BY created_at DESC",
                client_id
            )
            return [self._row_to_document(row) for row in rows]
    
    async def find_by_project_id(self, project_id: str) -> List[NextcloudDocument]:
        """Find documents by project ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_documents WHERE project_id = $1 ORDER BY created_at DESC",
                project_id
            )
            return [self._row_to_document(row) for row in rows]
    
    async def find_by_owner_id(self, owner_id: str) -> List[NextcloudDocument]:
        """Find documents by owner ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_documents WHERE owner_id = $1 ORDER BY created_at DESC",
                owner_id
            )
            return [self._row_to_document(row) for row in rows]
    
    async def find_by_nextcloud_file_id(self, nextcloud_file_id: str) -> Optional[NextcloudDocument]:
        """Find document by Nextcloud file ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM nextcloud_documents WHERE nextcloud_file_id = $1",
                nextcloud_file_id
            )
            return self._row_to_document(row) if row else None
    
    async def find_by_status(self, status: DocumentStatus) -> List[NextcloudDocument]:
        """Find documents by status"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_documents WHERE status = $1 ORDER BY created_at DESC",
                status.value
            )
            return [self._row_to_document(row) for row in rows]
    
    async def find_by_document_type(self, document_type: DocumentType) -> List[NextcloudDocument]:
        """Find documents by type"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_documents WHERE metadata->>'document_type' = $1 ORDER BY created_at DESC",
                document_type.value
            )
            return [self._row_to_document(row) for row in rows]
    
    async def find_shared_with_user(self, user_id: str) -> List[NextcloudDocument]:
        """Find documents shared with specific user"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM nextcloud_documents 
                WHERE shares::text LIKE '%"shared_with": "' || $1 || '"%'
                ORDER BY created_at DESC
            """, user_id)
            return [self._row_to_document(row) for row in rows]
    
    async def find_by_tags(self, tags: List[str]) -> List[NextcloudDocument]:
        """Find documents by tags"""
        async with self.pool.acquire() as conn:
            # Use JSONB containment operator
            rows = await conn.fetch("""
                SELECT * FROM nextcloud_documents 
                WHERE metadata->'tags' ?| $1
                ORDER BY created_at DESC
            """, tags)
            return [self._row_to_document(row) for row in rows]
    
    async def find_recent_documents(
        self, 
        user_id: str, 
        days: int = 7, 
        limit: int = 10
    ) -> List[NextcloudDocument]:
        """Find recently accessed documents for user"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM nextcloud_documents 
                WHERE (owner_id = $1 OR shares::text LIKE '%"shared_with": "' || $1 || '"%')
                AND last_accessed >= $2
                ORDER BY last_accessed DESC
                LIMIT $3
            """, user_id, cutoff_date, limit)
            return [self._row_to_document(row) for row in rows]
    
    async def search_documents(
        self,
        query: str,
        client_id: Optional[str] = None,
        project_id: Optional[str] = None,
        document_type: Optional[DocumentType] = None,
        status: Optional[DocumentStatus] = None,
        owner_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[NextcloudDocument]:
        """Search documents with filters"""
        conditions = []
        params = []
        param_count = 0
        
        if query:
            param_count += 1
            conditions.append(f"(file_name ILIKE ${param_count} OR metadata->>'title' ILIKE ${param_count} OR metadata->>'description' ILIKE ${param_count})")
            params.append(f"%{query}%")
        
        if client_id:
            param_count += 1
            conditions.append(f"client_id = ${param_count}")
            params.append(client_id)
        
        if project_id:
            param_count += 1
            conditions.append(f"project_id = ${param_count}")
            params.append(project_id)
        
        if document_type:
            param_count += 1
            conditions.append(f"metadata->>'document_type' = ${param_count}")
            params.append(document_type.value)
        
        if status:
            param_count += 1
            conditions.append(f"status = ${param_count}")
            params.append(status.value)
        
        if owner_id:
            param_count += 1
            conditions.append(f"owner_id = ${param_count}")
            params.append(owner_id)
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        param_count += 1
        params.append(limit)
        param_count += 1
        params.append(offset)
        
        sql = f"""
            SELECT * FROM nextcloud_documents 
            WHERE {where_clause}
            ORDER BY created_at DESC 
            LIMIT ${param_count-1} OFFSET ${param_count}
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
            return [self._row_to_document(row) for row in rows]
    
    async def get_document_statistics(self, client_id: str = None) -> Dict[str, Any]:
        """Get document statistics"""
        async with self.pool.acquire() as conn:
            where_clause = "WHERE client_id = $1" if client_id else ""
            params = [client_id] if client_id else []
            
            stats = await conn.fetchrow(f"""
                SELECT 
                    COUNT(*) as total_documents,
                    SUM(file_size) as total_size,
                    AVG(file_size) as avg_size,
                    COUNT(CASE WHEN status = 'Published' THEN 1 END) as published_documents,
                    COUNT(CASE WHEN last_accessed >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_accesses
                FROM nextcloud_documents 
                {where_clause}
            """, *params)
            
            type_stats = await conn.fetch(f"""
                SELECT metadata->>'document_type' as doc_type, COUNT(*) as count 
                FROM nextcloud_documents 
                {where_clause}
                GROUP BY metadata->>'document_type'
            """, *params)
            
            return {
                'total_documents': stats['total_documents'],
                'total_size_bytes': int(stats['total_size']) if stats['total_size'] else 0,
                'average_size_bytes': float(stats['avg_size']) if stats['avg_size'] else 0,
                'published_documents': stats['published_documents'],
                'recent_accesses': stats['recent_accesses'],
                'documents_by_type': {row['doc_type']: row['count'] for row in type_stats if row['doc_type']}
            }
    
    def _row_to_document(self, row) -> NextcloudDocument:
        """Convert database row to NextcloudDocument domain model"""
        if not row:
            return None
        
        # Parse metadata
        metadata_data = json.loads(row['metadata'])
        metadata = DocumentMetadata(
            title=metadata_data['title'],
            description=metadata_data.get('description'),
            document_type=DocumentType(metadata_data['document_type']),
            tags=metadata_data.get('tags', []),
            custom_properties=metadata_data.get('custom_properties', {}),
            compliance_classification=metadata_data.get('compliance_classification'),
            retention_period_days=metadata_data.get('retention_period_days')
        )
        
        # Parse versions
        versions_data = json.loads(row['versions']) if row['versions'] else []
        versions = [DocumentVersion(**version_data) for version_data in versions_data]
        
        # Parse shares
        shares_data = json.loads(row['shares']) if row['shares'] else []
        shares = []
        for share_data in shares_data:
            # Convert permissions back to enum list
            permissions = [SharePermission(p) for p in share_data['permissions']]
            share_data['permissions'] = permissions
            shares.append(DocumentShare(**share_data))
        
        # Create document
        document = NextcloudDocument(
            id=row['id'],
            nextcloud_file_id=row['nextcloud_file_id'],
            file_name=row['file_name'],
            file_path=row['file_path'],
            client_id=row['client_id'],
            project_id=row['project_id'],
            owner_id=row['owner_id'],
            metadata=metadata,
            status=DocumentStatus(row['status']),
            current_version=row['current_version'],
            versions=versions,
            shares=shares,
            file_size=row['file_size'],
            mime_type=row['mime_type'],
            checksum=row['checksum'],
            last_accessed=row['last_accessed'],
            download_count=row['download_count'],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return document


class PostgreSQLFolderRepository(DocumentFolderRepository):
    """PostgreSQL implementation of DocumentFolderRepository"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
    
    async def get_by_id(self, id: str) -> Optional[DocumentFolder]:
        """Get folder by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM nextcloud_folders WHERE id = $1", id
            )
            return self._row_to_folder(row) if row else None
    
    async def save(self, folder: DocumentFolder) -> DocumentFolder:
        """Save folder"""
        async with self.pool.acquire() as conn:
            # Check if folder exists
            existing = await conn.fetchrow(
                "SELECT version FROM nextcloud_folders WHERE id = $1", folder.id
            )
            
            if existing:
                # Update existing folder
                if existing['version'] != folder.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE nextcloud_folders SET
                        nextcloud_folder_id = $2,
                        folder_name = $3,
                        folder_path = $4,
                        parent_folder_id = $5,
                        client_id = $6,
                        project_id = $7,
                        owner_id = $8,
                        permissions = $9,
                        is_shared = $10,
                        document_count = $11,
                        subfolder_count = $12,
                        updated_at = $13,
                        version = $14
                    WHERE id = $1
                """, 
                    folder.id,
                    folder.nextcloud_folder_id,
                    folder.folder_name,
                    folder.folder_path,
                    folder.parent_folder_id,
                    folder.client_id,
                    folder.project_id,
                    folder.owner_id,
                    json.dumps(folder.permissions),
                    folder.is_shared,
                    folder.document_count,
                    folder.subfolder_count,
                    folder.updated_at,
                    folder.version
                )
            else:
                # Insert new folder
                await conn.execute("""
                    INSERT INTO nextcloud_folders (
                        id, nextcloud_folder_id, folder_name, folder_path, parent_folder_id,
                        client_id, project_id, owner_id, permissions, is_shared,
                        document_count, subfolder_count, created_at, updated_at, version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                """,
                    folder.id,
                    folder.nextcloud_folder_id,
                    folder.folder_name,
                    folder.folder_path,
                    folder.parent_folder_id,
                    folder.client_id,
                    folder.project_id,
                    folder.owner_id,
                    json.dumps(folder.permissions),
                    folder.is_shared,
                    folder.document_count,
                    folder.subfolder_count,
                    folder.created_at,
                    folder.updated_at,
                    folder.version
                )
        
        return folder
    
    async def delete(self, id: str) -> bool:
        """Delete folder"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM nextcloud_folders WHERE id = $1", id
            )
            return result == "DELETE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[DocumentFolder]:
        """Find all folders"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_folders ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_folder(row) for row in rows]
    
    async def find_by_client_id(self, client_id: str) -> List[DocumentFolder]:
        """Find folders by client ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_folders WHERE client_id = $1 ORDER BY folder_path",
                client_id
            )
            return [self._row_to_folder(row) for row in rows]
    
    async def find_by_project_id(self, project_id: str) -> List[DocumentFolder]:
        """Find folders by project ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_folders WHERE project_id = $1 ORDER BY folder_path",
                project_id
            )
            return [self._row_to_folder(row) for row in rows]
    
    async def find_by_parent_folder(self, parent_folder_id: str) -> List[DocumentFolder]:
        """Find subfolders by parent folder ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM nextcloud_folders WHERE parent_folder_id = $1 ORDER BY folder_name",
                parent_folder_id
            )
            return [self._row_to_folder(row) for row in rows]
    
    async def find_by_nextcloud_folder_id(self, nextcloud_folder_id: str) -> Optional[DocumentFolder]:
        """Find folder by Nextcloud folder ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM nextcloud_folders WHERE nextcloud_folder_id = $1",
                nextcloud_folder_id
            )
            return self._row_to_folder(row) if row else None
    
    async def get_folder_tree(self, client_id: str, project_id: str = None) -> Dict[str, Any]:
        """Get hierarchical folder structure"""
        # This would build a tree structure - simplified implementation
        if project_id:
            folders = await self.find_by_project_id(project_id)
        else:
            folders = await self.find_by_client_id(client_id)
        
        # Build tree structure (simplified)
        tree = {
            'folders': [folder.dict() for folder in folders],
            'total_count': len(folders)
        }
        
        return tree
    
    def _row_to_folder(self, row) -> DocumentFolder:
        """Convert database row to DocumentFolder domain model"""
        if not row:
            return None
        
        # Parse permissions
        permissions = json.loads(row['permissions']) if row['permissions'] else {}
        
        # Create folder
        folder = DocumentFolder(
            id=row['id'],
            nextcloud_folder_id=row['nextcloud_folder_id'],
            folder_name=row['folder_name'],
            folder_path=row['folder_path'],
            parent_folder_id=row['parent_folder_id'],
            client_id=row['client_id'],
            project_id=row['project_id'],
            owner_id=row['owner_id'],
            permissions=permissions,
            is_shared=row['is_shared'],
            document_count=row['document_count'],
            subfolder_count=row['subfolder_count'],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return folder
