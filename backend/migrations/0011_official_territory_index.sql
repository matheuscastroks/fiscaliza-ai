CREATE INDEX idx_official_calls_neighborhood_period
  ON official_calls(municipality_id,neighborhood_id,opened_at);
