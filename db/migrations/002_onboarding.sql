-- 002_onboarding.sql
-- Adds onboarding state to users and a preferences table

ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE user_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  age_range        TEXT CHECK (age_range IN ('13-17','18-24','25-34','35-44','45-54','55+')),
  gender           TEXT CHECK (gender IN ('female','male','other','prefer_not_to_say')),
  nickname         TEXT,
  vocabulary_level TEXT CHECK (vocabulary_level IN ('beginner','intermediate','advanced')),
  known_words      JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
