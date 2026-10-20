CREATE TABLE data_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  provider text NOT NULL,
  official_url text NOT NULL,
  attribution text,
  usage text NOT NULL DEFAULT 'unknown' CHECK (usage IN ('individual','aggregate','unknown')),
  usage_evidence_url text,
  state text NOT NULL DEFAULT 'unavailable' CHECK (state IN ('available','stale','unavailable','restricted')),
  coverage text NOT NULL DEFAULT 'unknown' CHECK (coverage IN ('complete','partial','unknown')),
  reference_date date,
  source_updated_at timestamptz,
  published_at timestamptz,
  published_run_id text REFERENCES source_sync_runs(id),
  details jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE territorial_boundaries (
  id text PRIMARY KEY,
  municipality_id text NOT NULL DEFAULT '3304557' REFERENCES municipalities(id),
  source_id text NOT NULL REFERENCES data_sources(id),
  external_id text NOT NULL,
  name text NOT NULL,
  geometry jsonb NOT NULL,
  original_data jsonb NOT NULL DEFAULT '{}',
  last_seen_run_id text REFERENCES source_sync_runs(id),
  UNIQUE (source_id,external_id)
);
CREATE TABLE territorial_boundary_aliases (
  source_id text NOT NULL REFERENCES data_sources(id),
  external_code text NOT NULL,
  boundary_id text NOT NULL REFERENCES territorial_boundaries(id),
  PRIMARY KEY (source_id,external_code)
);
CREATE TABLE public_facilities (
  id text PRIMARY KEY,
  municipality_id text NOT NULL DEFAULT '3304557' REFERENCES municipalities(id),
  source_id text NOT NULL REFERENCES data_sources(id),
  external_id text NOT NULL,
  category text NOT NULL CHECK (category IN ('school','health','square')),
  name text NOT NULL,
  address text,
  phone text,
  opening_hours text,
  activity text,
  facility_type text,
  neighborhood_id text REFERENCES territorial_boundaries(id),
  neighborhood_name text,
  latitude double precision,
  longitude double precision,
  geometry jsonb,
  original_data jsonb NOT NULL DEFAULT '{}',
  last_seen_run_id text REFERENCES source_sync_runs(id),
  UNIQUE (source_id,external_id),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);
CREATE INDEX public_facilities_category_neighborhood ON public_facilities(category,neighborhood_id);
CREATE INDEX public_facilities_source_snapshot ON public_facilities(source_id,last_seen_run_id);
CREATE INDEX public_facilities_location ON public_facilities(latitude,longitude);
CREATE INDEX territorial_boundaries_source_snapshot ON territorial_boundaries(source_id,last_seen_run_id);
