CREATE OR REPLACE FUNCTION official_search_fold(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT PARALLEL SAFE
AS $$
  SELECT translate(normalize(lower(value), NFC),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn');
$$;

CREATE INDEX IF NOT EXISTS idx_official_calls_search_fold_trgm ON official_calls
USING gin (
  official_search_fold(service_type) gin_trgm_ops,
  official_search_fold(service_subtype) gin_trgm_ops,
  official_search_fold(neighborhood_name) gin_trgm_ops,
  official_search_fold(organization_name) gin_trgm_ops,
  official_search_fold(status_justification) gin_trgm_ops
);
