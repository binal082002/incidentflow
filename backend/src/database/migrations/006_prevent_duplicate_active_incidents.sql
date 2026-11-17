CREATE UNIQUE INDEX IF NOT EXISTS idx_incidents_one_active_per_fingerprint
ON incidents (service_id, fingerprint)
WHERE status IN ('open', 'acknowledged')
  AND fingerprint IS NOT NULL;