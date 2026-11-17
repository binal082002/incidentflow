ALTER TABLE events
ADD COLUMN event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_service_event_id
ON events (service_id, event_id);