-- 005_word_enrichment.sql
-- Adds difficulty metadata columns to words table for adaptive learning.

ALTER TABLE words ADD COLUMN IF NOT EXISTS frequency_zipf      REAL;
ALTER TABLE words ADD COLUMN IF NOT EXISTS age_of_acquisition   REAL;
ALTER TABLE words ADD COLUMN IF NOT EXISTS cefr_level           TEXT CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2'));
ALTER TABLE words ADD COLUMN IF NOT EXISTS difficulty_score     REAL;
ALTER TABLE words ADD COLUMN IF NOT EXISTS word_length          INT;
ALTER TABLE words ADD COLUMN IF NOT EXISTS part_of_speech       TEXT;
ALTER TABLE words ADD COLUMN IF NOT EXISTS sentence             TEXT;
ALTER TABLE words ADD COLUMN IF NOT EXISTS gap_sentence         TEXT;

CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty_score);
