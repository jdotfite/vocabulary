-- 004_practice_modes.sql
-- Allow null tier_id for pseudo-modes (shuffle, sprint, etc.)

ALTER TABLE practice_sessions ALTER COLUMN tier_id DROP NOT NULL;
ALTER TABLE practice_sessions ADD COLUMN mode_type TEXT;
