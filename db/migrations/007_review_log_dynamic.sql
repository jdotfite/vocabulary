-- 007_review_log_dynamic.sql
-- Allow review_log entries for dynamically assembled questions (no static question_id).

ALTER TABLE review_log ALTER COLUMN question_id DROP NOT NULL;
ALTER TABLE review_log ADD COLUMN IF NOT EXISTS question_type TEXT;
