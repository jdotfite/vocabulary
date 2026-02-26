-- 006_ability_srs.sql
-- Adds user ability tracking (Elo-like) and SRS interval to support adaptive learning.

ALTER TABLE users ADD COLUMN IF NOT EXISTS ability_score REAL NOT NULL DEFAULT 50.0;

ALTER TABLE user_word_stats ADD COLUMN IF NOT EXISTS srs_interval_hours INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS ability_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_score REAL NOT NULL,
  new_score REAL NOT NULL,
  word_id UUID NOT NULL REFERENCES words(id),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ability_log_user ON ability_log(user_id);
CREATE INDEX IF NOT EXISTS idx_uws_review ON user_word_stats(user_id, next_review_at) WHERE next_review_at IS NOT NULL;
