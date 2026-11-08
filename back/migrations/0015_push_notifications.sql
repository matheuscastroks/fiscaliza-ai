CREATE TABLE IF NOT EXISTS user_push_tokens (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  push_token text NOT NULL UNIQUE,
  platform text NOT NULL,
  municipality_id text NOT NULL REFERENCES municipalities(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_notification_followers (
  id text PRIMARY KEY,
  call_id text NOT NULL REFERENCES official_calls(id) ON DELETE CASCADE,
  push_token text NOT NULL REFERENCES user_push_tokens(push_token) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  last_notified_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_call_follower UNIQUE (call_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_call_followers_call ON call_notification_followers(call_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON user_push_tokens(user_id);
