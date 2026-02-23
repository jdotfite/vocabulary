-- VocabDeck Database Schema
-- Neon Postgres — designed for future auth migration
-- Run: psql $DATABASE_URL -f db/schema.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Content tables (seeded from static JSON)
-- ---------------------------------------------------------------------------

CREATE TABLE difficulty_tiers (
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

CREATE TABLE words (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word        TEXT UNIQUE NOT NULL,
  phonetic    TEXT NOT NULL,
  definition  TEXT NOT NULL,
  tier_id     UUID NOT NULL REFERENCES difficulty_tiers(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE word_examples (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id       UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sentence      TEXT NOT NULL,
  gap_sentence  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questions (
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

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_token    TEXT UNIQUE,
  google_id     TEXT UNIQUE,
  display_name  TEXT,
  email         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- User progress tables
-- ---------------------------------------------------------------------------

CREATE TABLE user_word_stats (
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

CREATE TABLE user_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id     UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_id)
);

CREATE TABLE user_bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id     UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_id)
);

CREATE TABLE practice_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id       UUID NOT NULL REFERENCES difficulty_tiers(id),
  score         INT  NOT NULL,
  total         INT  NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE review_log (
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

CREATE INDEX idx_words_tier              ON words(tier_id);
CREATE INDEX idx_word_examples_word      ON word_examples(word_id);
CREATE INDEX idx_questions_word          ON questions(word_id);
CREATE INDEX idx_questions_tier          ON questions(tier_id);
CREATE INDEX idx_user_word_stats_user    ON user_word_stats(user_id);
CREATE INDEX idx_user_word_stats_word    ON user_word_stats(word_id);
CREATE INDEX idx_user_favorites_user     ON user_favorites(user_id);
CREATE INDEX idx_user_bookmarks_user     ON user_bookmarks(user_id);
CREATE INDEX idx_practice_sessions_user  ON practice_sessions(user_id);
CREATE INDEX idx_review_log_session      ON review_log(session_id);
CREATE INDEX idx_review_log_user         ON review_log(user_id);

COMMIT;
