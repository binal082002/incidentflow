ALTER TABLE incidents
ADD COLUMN severity_reasons JSONB NOT NULL DEFAULT '[]'::jsonb;