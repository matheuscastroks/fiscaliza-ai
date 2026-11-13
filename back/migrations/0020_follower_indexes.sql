-- Buscas e exclusões de seguidores por token (registro de aparelho, sair da
-- conta, limite por aparelho) e por conta varriam a tabela inteira.
CREATE INDEX IF NOT EXISTS idx_call_followers_push_token ON call_notification_followers(push_token);
CREATE INDEX IF NOT EXISTS idx_call_followers_user ON call_notification_followers(user_id);

-- Coberto pelo prefixo de idx_official_calls_cursor (municipality_id, opened_at, external_id).
DROP INDEX IF EXISTS idx_official_calls_municipality_id;
