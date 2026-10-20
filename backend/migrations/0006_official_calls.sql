CREATE TABLE IF NOT EXISTS official_calls (
  id text PRIMARY KEY,
  external_id text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'rio1746',
  municipality_id text NOT NULL DEFAULT '3304557',
  service_category text,
  service_type text NOT NULL,
  service_subtype text NOT NULL,
  organization_name text,
  official_status text,
  official_situation text,
  official_situation_type text,
  status_justification text,
  opened_at timestamptz NOT NULL,
  closed_at timestamptz,
  target_date timestamptz,
  within_deadline text,
  time_remaining integer,
  time_unit text,
  neighborhood_id text,
  neighborhood_name text,
  subprefecture text,
  latitude double precision,
  longitude double precision,
  source_partition_date date,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_official_calls_external_id ON official_calls(external_id);
CREATE INDEX IF NOT EXISTS idx_official_calls_municipality_id ON official_calls(municipality_id);
CREATE INDEX IF NOT EXISTS idx_official_calls_neighborhood_name ON official_calls(neighborhood_name);
CREATE INDEX IF NOT EXISTS idx_official_calls_service_type ON official_calls(service_type);
CREATE INDEX IF NOT EXISTS idx_official_calls_opened_at ON official_calls(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_official_calls_official_situation ON official_calls(official_situation);
CREATE INDEX IF NOT EXISTS idx_official_calls_lat_lng ON official_calls(latitude, longitude);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id text PRIMARY KEY,
  last_partition text,
  records_imported integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'idle',
  last_synced_at timestamptz,
  error_message text
);
