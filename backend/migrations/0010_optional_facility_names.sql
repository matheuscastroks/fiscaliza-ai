-- The official public-space register contains unnamed entries.
-- Preserve absence instead of inventing an authoritative cadastral name.
ALTER TABLE public_facilities ALTER COLUMN name DROP NOT NULL;
