CREATE TABLE demo_engagement (
  record_id text PRIMARY KEY REFERENCES records(id) ON DELETE CASCADE,
  views integer NOT NULL CHECK (views >= 0),
  supports integer NOT NULL CHECK (supports >= 0 AND supports <= views)
);
