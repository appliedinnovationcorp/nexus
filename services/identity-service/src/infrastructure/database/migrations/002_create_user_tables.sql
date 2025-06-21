-- User Service Specific Tables

-- User snapshots table - CQRS read model
CREATE TABLE IF NOT EXISTS user_snapshots (
    id UUID PRIMARY KEY,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for user snapshots
CREATE INDEX IF NOT EXISTS idx_user_snapshots_email ON user_snapshots USING GIN ((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_user_snapshots_role ON user_snapshots USING GIN ((data->>'role'));
CREATE INDEX IF NOT EXISTS idx_user_snapshots_active ON user_snapshots USING GIN ((data->>'isActive'));
CREATE INDEX IF NOT EXISTS idx_user_snapshots_org ON user_snapshots USING GIN ((data->>'organizationId'));
CREATE INDEX IF NOT EXISTS idx_user_snapshots_updated_at ON user_snapshots(updated_at);

-- User credentials table - separate for security
CREATE TABLE IF NOT EXISTS user_credentials (
    user_id UUID PRIMARY KEY REFERENCES user_snapshots(id) ON DELETE CASCADE,
    password_hash VARCHAR(255),
    salt VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for user credentials
CREATE INDEX IF NOT EXISTS idx_user_credentials_reset_token ON user_credentials(reset_token);
CREATE INDEX IF NOT EXISTS idx_user_credentials_email_token ON user_credentials(email_verification_token);

-- User sessions table - track active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_snapshots(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- User activities table - audit log
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_snapshots(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for user activities
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp);

-- User permissions table - RBAC
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_snapshots(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    permissions TEXT[] NOT NULL,
    granted_by UUID NOT NULL REFERENCES user_snapshots(id),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for user permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at);

-- User preferences table - user settings
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES user_snapshots(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'auto',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER update_user_snapshots_updated_at 
    BEFORE UPDATE ON user_snapshots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credentials_updated_at 
    BEFORE UPDATE ON user_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) for Supabase
-- Users can only see their own data unless they're admin
ALTER TABLE user_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own data" ON user_snapshots
    FOR SELECT USING (
        id = auth.uid() OR 
        (data->>'role' IN ('admin', 'moderator'))
    );

CREATE POLICY "Users can update their own data" ON user_snapshots
    FOR UPDATE USING (
        id = auth.uid() OR 
        (SELECT data->>'role' FROM user_snapshots WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Only admins can insert users" ON user_snapshots
    FOR INSERT WITH CHECK (
        (SELECT data->>'role' FROM user_snapshots WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Users can view their own credentials" ON user_credentials
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (SELECT data->>'role' FROM user_snapshots WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Users can view their own permissions" ON user_permissions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (SELECT data->>'role' FROM user_snapshots WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());
