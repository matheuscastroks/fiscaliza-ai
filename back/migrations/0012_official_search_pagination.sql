-- Transactional migration: schedule a maintenance window for large installations.
-- One multicolumn GIN index supports the existing six ILIKE alternatives.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_official_calls_search_trgm ON official_calls
USING gin (service_type gin_trgm_ops, service_subtype gin_trgm_ops,
  neighborhood_name gin_trgm_ops, organization_name gin_trgm_ops,
  status_justification gin_trgm_ops, external_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_official_calls_cursor ON official_calls
  (municipality_id, opened_at DESC, external_id DESC);
