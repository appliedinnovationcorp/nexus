-- Nexus Platform Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE nexus SET row_security = on;

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'business' CHECK (type IN ('enterprise', 'business', 'nonprofit', 'startup')),
    description TEXT,
    domain VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    member_limit INTEGER DEFAULT 100,
    allow_public_signup BOOLEAN DEFAULT false,
    require_email_verification BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'moderator', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT false,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    provider VARCHAR(50) DEFAULT 'email',
    provider_id VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    backup_codes TEXT[],
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activities table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members table
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Project milestones table
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content categories table
CREATE TABLE content_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slug, organization_id)
);

-- Content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    type VARCHAR(50) DEFAULT 'post' CHECK (type IN ('page', 'post', 'article', 'documentation', 'faq')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'scheduled')),
    content TEXT,
    excerpt TEXT,
    featured_image_url TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    tags TEXT[],
    seo_title VARCHAR(500),
    seo_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slug, organization_id)
);

-- Storage buckets table
CREATE TABLE storage_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    public BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage files table
CREATE TABLE storage_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_id UUID NOT NULL REFERENCES storage_buckets(id) ON DELETE CASCADE,
    key VARCHAR(500) NOT NULL,
    name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size BIGINT NOT NULL,
    etag VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bucket_id, key)
);

-- Edge functions table
CREATE TABLE edge_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    runtime VARCHAR(50) DEFAULT 'deno',
    code TEXT NOT NULL,
    environment_variables JSONB DEFAULT '{}',
    region VARCHAR(50) DEFAULT 'us-east-1',
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'deploying', 'error')),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, organization_id)
);

-- Function invocations table (for analytics)
CREATE TABLE function_invocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    function_id UUID NOT NULL REFERENCES edge_functions(id) ON DELETE CASCADE,
    duration_ms INTEGER,
    memory_used_mb INTEGER,
    status_code INTEGER,
    error_message TEXT,
    invoked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime channels table
CREATE TABLE realtime_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'broadcast' CHECK (type IN ('broadcast', 'presence', 'postgres_changes')),
    description TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, organization_id)
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    scope VARCHAR(50) DEFAULT 'global' CHECK (scope IN ('global', 'organization', 'project', 'own')),
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'custom' CHECK (type IN ('system', 'custom')),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, organization_id)
);

-- Role permissions table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- User roles table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id, organization_id)
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    properties JSONB DEFAULT '{}',
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_content_author_id ON content(author_id);
CREATE INDEX idx_content_category_id ON content(category_id);
CREATE INDEX idx_content_organization_id ON content(organization_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_published_at ON content(published_at);
CREATE INDEX idx_storage_files_bucket_id ON storage_files(bucket_id);
CREATE INDEX idx_storage_files_organization_id ON storage_files(organization_id);
CREATE INDEX idx_function_invocations_function_id ON function_invocations(function_id);
CREATE INDEX idx_function_invocations_invoked_at ON function_invocations(invoked_at);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storage_buckets_updated_at BEFORE UPDATE ON storage_buckets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_edge_functions_updated_at BEFORE UPDATE ON edge_functions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_realtime_channels_updated_at BEFORE UPDATE ON realtime_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action, scope, category) VALUES
-- User permissions
('user.create', 'Create new users', 'User', 'create', 'global', 'user'),
('user.read', 'View user information', 'User', 'read', 'global', 'user'),
('user.update', 'Update user information', 'User', 'update', 'global', 'user'),
('user.delete', 'Delete users', 'User', 'delete', 'global', 'user'),
('user.read_own', 'View own profile', 'User', 'read', 'own', 'user'),
('user.update_own', 'Update own profile', 'User', 'update', 'own', 'user'),

-- Organization permissions
('organization.create', 'Create organizations', 'Organization', 'create', 'global', 'organization'),
('organization.read', 'View organization information', 'Organization', 'read', 'organization', 'organization'),
('organization.update', 'Update organization information', 'Organization', 'update', 'organization', 'organization'),
('organization.delete', 'Delete organizations', 'Organization', 'delete', 'organization', 'organization'),
('organization.manage_members', 'Manage organization members', 'Organization', 'manage', 'organization', 'organization'),

-- Project permissions
('project.create', 'Create projects', 'Project', 'create', 'organization', 'project'),
('project.read', 'View project information', 'Project', 'read', 'project', 'project'),
('project.update', 'Update project information', 'Project', 'update', 'project', 'project'),
('project.delete', 'Delete projects', 'Project', 'delete', 'project', 'project'),
('project.manage_members', 'Manage project members', 'Project', 'manage', 'project', 'project'),

-- Content permissions
('content.create', 'Create content', 'Content', 'create', 'organization', 'content'),
('content.read', 'View content', 'Content', 'read', 'organization', 'content'),
('content.update', 'Update content', 'Content', 'update', 'organization', 'content'),
('content.delete', 'Delete content', 'Content', 'delete', 'organization', 'content'),
('content.publish', 'Publish content', 'Content', 'manage', 'organization', 'content'),

-- Storage permissions
('storage.upload', 'Upload files', 'Storage', 'create', 'organization', 'storage'),
('storage.download', 'Download files', 'Storage', 'read', 'organization', 'storage'),
('storage.delete', 'Delete files', 'Storage', 'delete', 'organization', 'storage'),
('storage.manage_buckets', 'Manage storage buckets', 'Storage', 'manage', 'organization', 'storage'),

-- Function permissions
('function.create', 'Create edge functions', 'Function', 'create', 'organization', 'function'),
('function.read', 'View edge functions', 'Function', 'read', 'organization', 'function'),
('function.update', 'Update edge functions', 'Function', 'update', 'organization', 'function'),
('function.delete', 'Delete edge functions', 'Function', 'delete', 'organization', 'function'),
('function.deploy', 'Deploy edge functions', 'Function', 'manage', 'organization', 'function'),

-- System permissions
('system.admin', 'Full system administration', 'System', 'manage', 'global', 'system'),
('system.analytics', 'View system analytics', 'System', 'read', 'global', 'system'),
('system.settings', 'Manage system settings', 'System', 'manage', 'global', 'system');

-- Insert default roles
INSERT INTO roles (name, description, type) VALUES
('Super Admin', 'Full system access with all permissions', 'system'),
('Admin', 'Administrative access to most features', 'system'),
('Moderator', 'Moderate content and manage users', 'system'),
('User', 'Basic user access', 'system');

-- Insert default storage buckets
INSERT INTO storage_buckets (name, description, public) VALUES
('public', 'Public files accessible to all users', true),
('private', 'Private user files', false),
('uploads', 'Temporary upload storage', false);

-- Sample data (optional - remove in production)
INSERT INTO organizations (name, slug, type, description) VALUES
('Acme Corporation', 'acme-corp', 'enterprise', 'A leading technology company'),
('StartupXYZ', 'startup-xyz', 'startup', 'An innovative startup'),
('Global Nonprofit', 'global-nonprofit', 'nonprofit', 'Making the world a better place'),
('Business Solutions Inc', 'business-solutions', 'business', 'Professional business services');

-- Create RLS policies (examples)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Project members can view projects they belong to
CREATE POLICY "Project members can view projects" ON projects
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = id AND user_id = auth.uid()
        )
    );

-- Content authors can manage their own content
CREATE POLICY "Authors can manage own content" ON content
    FOR ALL USING (auth.uid() = author_id);
