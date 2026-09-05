ALTER TABLE projects
ADD COLUMN ingest_key_hash TEXT;

CREATE UNIQUE INDEX idx_projects_ingest_key_hash
ON projects(ingest_key_hash)
WHERE ingest_key_hash IS NOT NULL;