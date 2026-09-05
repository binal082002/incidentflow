CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE event_level AS ENUM (
    'INFO',
    'WARN',
    'ERROR',
    'FATAL'
);

CREATE TYPE environment_type AS ENUM (
    'development',
    'staging',
    'production'
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(project_id, name)
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    fingerprint VARCHAR(255),

    severity VARCHAR(20) NOT NULL DEFAULT 'low',

    status VARCHAR(20) NOT NULL DEFAULT 'open',

    event_count INTEGER NOT NULL DEFAULT 0,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,

    environment environment_type NOT NULL,

    level event_level NOT NULL,
    
    message TEXT NOT NULL,

    endpoint VARCHAR(255),

    error_type VARCHAR(100),

    fingerprint VARCHAR(255),

    occurred_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_service_id
ON events(service_id);

CREATE INDEX idx_events_fingerprint
ON events(fingerprint);

CREATE INDEX idx_events_occurred_at
ON events(occurred_at);

CREATE INDEX idx_incidents_service_id
ON incidents(service_id);

CREATE INDEX idx_incidents_fingerprint
ON incidents(fingerprint);

CREATE INDEX idx_incidents_status
ON incidents(status);