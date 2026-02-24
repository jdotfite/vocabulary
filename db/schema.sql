-- VocabDeck Database Schema
-- Neon Postgres — designed for future auth migration
-- Run: psql $DATABASE_URL -f db/schema.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Content tables (seeded from static JSON)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS difficulty_tiers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_id       TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  audience      TEXT NOT NULL CHECK (audience IN ('kids', 'adult')),
  tier          TEXT NOT NULL,
  grade_band    TEXT NOT NULL,
  min_word_len  INT  NOT NULL,
  max_word_len  INT  NOT NULL,
  sort_order    INT  NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS words (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word        TEXT UNIQUE NOT NULL,
  phonetic    TEXT NOT NULL,
  definition  TEXT NOT NULL,
  tier_id     UUID NOT NULL REFERENCES difficulty_tiers(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS word_examples (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id       UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sentence      TEXT NOT NULL,
  gap_sentence  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     TEXT UNIQUE NOT NULL,
  word_id         UUID NOT NULL REFERENCES words(id),
  tier_id         UUID NOT NULL REFERENCES difficulty_tiers(id),
  question_type   TEXT NOT NULL CHECK (question_type IN ('guess_word', 'meaning_match', 'fill_gap')),
  prompt          TEXT NOT NULL,
  options         JSONB NOT NULL,
  correct_index   INT  NOT NULL CHECK (correct_index BETWEEN 0 AND 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- User identity (dual: anonymous token + Google OAuth for future migration)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_token            TEXT UNIQUE,
  google_id             TEXT UNIQUE,
  display_name          TEXT,
  email                 TEXT,
  avatar_url            TEXT,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- User progress tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_word_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id         UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  times_seen      INT  NOT NULL DEFAULT 0,
  times_correct   INT  NOT NULL DEFAULT 0,
  times_incorrect INT  NOT NULL DEFAULT 0,
  streak          INT  NOT NULL DEFAULT 0,
  mastery_level   INT  NOT NULL DEFAULT 0,
  last_seen_at    TIMESTAMPTZ,
  next_review_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS user_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id     UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id     UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  age_range         TEXT CHECK (age_range IN ('13-17','18-24','25-34','35-44','45-54','55+')),
  gender            TEXT CHECK (gender IN ('female','male','other','prefer_not_to_say')),
  nickname          TEXT,
  vocabulary_level  TEXT CHECK (vocabulary_level IN ('beginner','intermediate','advanced')),
  known_words       JSONB NOT NULL DEFAULT '[]'::JSONB,
  splash_dismissed  JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practice_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id       UUID REFERENCES difficulty_tiers(id),
  mode_type     TEXT,
  score         INT  NOT NULL,
  total         INT  NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id),
  word_id         UUID NOT NULL REFERENCES words(id),
  selected_index  INT     NOT NULL,
  correct_index   INT     NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_words_tier              ON words(tier_id);
CREATE INDEX IF NOT EXISTS idx_word_examples_word      ON word_examples(word_id);
CREATE INDEX IF NOT EXISTS idx_questions_word          ON questions(word_id);
CREATE INDEX IF NOT EXISTS idx_questions_tier          ON questions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_word_stats_user    ON user_word_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_stats_word    ON user_word_stats(word_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user     ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user     ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user   ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user  ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_log_session      ON review_log(session_id);
CREATE INDEX IF NOT EXISTS idx_review_log_user         ON review_log(user_id);

-- ---------------------------------------------------------------------------
-- Migrations (safe to re-run)
-- ---------------------------------------------------------------------------

-- Add splash_dismissed column for existing installs (migrated from BOOLEAN to JSONB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'splash_dismissed'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN splash_dismissed JSONB NOT NULL DEFAULT '[]'::JSONB;
  ELSIF (
    SELECT data_type FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'splash_dismissed'
  ) = 'boolean' THEN
    -- Preserve legacy intent: true → all challenge modes dismissed
    ALTER TABLE user_preferences ALTER COLUMN splash_dismissed TYPE JSONB
      USING CASE WHEN splash_dismissed THEN '["sprint","perfection","rush","level_test"]'::JSONB ELSE '[]'::JSONB END;
    ALTER TABLE user_preferences ALTER COLUMN splash_dismissed SET DEFAULT '[]'::JSONB;
  END IF;
END $$;

COMMIT;
