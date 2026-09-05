CREATE TABLE incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    incident_id UUID NOT NULL
        REFERENCES incidents(id)
        ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incident_timeline_incident_id
ON incident_timeline(incident_id);