ALTER TABLE official_calls
  ADD COLUMN IF NOT EXISTS diagnosis_target_date timestamptz,
  ADD COLUMN IF NOT EXISTS deadline_type text,
  ADD COLUMN IF NOT EXISTS complaints_count integer,
  ADD COLUMN IF NOT EXISTS street_name text;
