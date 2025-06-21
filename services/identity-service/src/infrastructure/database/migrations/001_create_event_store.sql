-- Event Store Schema
-- This schema supports both PostgreSQL and Supabase

-- Events table - stores all domain events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL,
    position BIGSERIAL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_stream_id ON events(stream_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_position ON events(position);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_stream_version ON events(stream_id, version);

-- Unique constraint to prevent duplicate events in same stream
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_stream_version_unique ON events(stream_id, version);

-- Snapshots table - stores aggregate snapshots for performance
CREATE TABLE IF NOT EXISTS snapshots (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_aggregate_type ON snapshots(aggregate_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_updated_at ON snapshots(updated_at);

-- Event subscriptions table - tracks event processing
CREATE TABLE IF NOT EXISTS event_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_name VARCHAR(255) NOT NULL UNIQUE,
    last_processed_position BIGINT NOT NULL DEFAULT 0,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_snapshots_updated_at 
    BEFORE UPDATE ON snapshots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_subscriptions_updated_at 
    BEFORE UPDATE ON event_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
