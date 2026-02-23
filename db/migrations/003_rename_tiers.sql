-- 003_rename_tiers.sql
-- Standardize tier naming: beginner/intermediate/advanced for both audiences

UPDATE difficulty_tiers SET mode_id = 'kids_beginner',     display_name = 'Kids Beginner',     tier = 'beginner'     WHERE mode_id = 'kids_easy';
UPDATE difficulty_tiers SET mode_id = 'kids_intermediate', display_name = 'Kids Intermediate', tier = 'intermediate' WHERE mode_id = 'kids_middle';
UPDATE difficulty_tiers SET mode_id = 'adult_beginner',    display_name = 'Adult Beginner',    tier = 'beginner'     WHERE mode_id = 'adult_elementary';

-- Also update question_ids that embed old names
UPDATE questions SET question_id = REPLACE(question_id, 'kids_easy_',        'kids_beginner_')     WHERE question_id LIKE 'kids_easy_%';
UPDATE questions SET question_id = REPLACE(question_id, 'kids_middle_',      'kids_intermediate_') WHERE question_id LIKE 'kids_middle_%';
UPDATE questions SET question_id = REPLACE(question_id, 'adult_elementary_', 'adult_beginner_')    WHERE question_id LIKE 'adult_elementary_%';
