-- Chamados salvos ficam na conta, não no aparelho: ao entrar em outro celular
-- a lista volta. Apagar a conta apaga a lista.
CREATE TABLE IF NOT EXISTS saved_calls (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_id text NOT NULL REFERENCES official_calls(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, call_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_calls_user ON saved_calls(user_id, saved_at DESC);
