CREATE TABLE source_sync_runs (
  id text PRIMARY KEY,
  source_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('running','success','partial','failed')),
  coverage text NOT NULL CHECK (coverage IN ('complete','partial','unknown')),
  requested_start date NOT NULL,
  requested_end date NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  received_count integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX source_sync_runs_latest ON source_sync_runs(source_id, started_at DESC);
