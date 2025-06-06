-- SQL script to delete all records created on June 4th, 2025
-- Execute in order to avoid foreign key constraint violations

-- Define the target date range
-- June 4th, 2025: from 2025-06-04 00:00:00 to 2025-06-04 23:59:59.999999

-- Step 1: Delete records that are referenced by no other tables first
-- Delete progressions (references selected_exercises and training_blocks)
DELETE FROM "progressions" 
WHERE DATE(created_at) = '2025-06-04';

-- Delete volume_reductions (references selected_exercises and training_blocks)
DELETE FROM "volume_reductions" 
WHERE DATE(created_at) = '2025-06-04';

-- Delete effort_reductions (references selected_exercises and training_blocks)
DELETE FROM "effort_reductions" 
WHERE DATE(created_at) = '2025-06-04';

-- Step 2: Delete selected_exercises (references sessions, exercises, training_blocks)
DELETE FROM "selected_exercises" 
WHERE DATE(created_at) = '2025-06-04';

-- Step 3: Delete training_blocks (references sessions)
DELETE FROM "training_blocks" 
WHERE DATE(created_at) = '2025-06-04';

-- Step 4: Delete session_days (references sessions)
DELETE FROM "session_days" 
WHERE DATE(created_at) = '2025-06-04';

-- Step 5: Delete sessions (references training_plans)
DELETE FROM "sessions" 
WHERE DATE(created_at) = '2025-06-04';

-- Step 6: Handle circular reference between training_plans and training_models
-- First, update training_plans to remove model_id references
UPDATE "training_plans" 
SET model_id = NULL 
WHERE DATE(created_at) = '2025-06-04' AND model_id IS NOT NULL;

-- Now delete training_models (references training_plans)
DELETE FROM "training_models" 
WHERE DATE(created_at) = '2025-06-04';

-- Delete training_plans (references training_models - but we've already deleted those)
DELETE FROM "training_plans" 
WHERE DATE(created_at) = '2025-06-04';

-- Step 7: Delete exercises (no incoming foreign keys except from selected_exercises which we already deleted)
DELETE FROM "exercises" 
WHERE DATE(created_at) = '2025-06-04';

-- Optional: Report how many records were affected
-- You can uncomment these to see the counts before deletion:

/*
-- Check counts before deletion:
SELECT 'progressions' as table_name, COUNT(*) as count FROM "progressions" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'volume_reductions', COUNT(*) FROM "volume_reductions" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'effort_reductions', COUNT(*) FROM "effort_reductions" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'selected_exercises', COUNT(*) FROM "selected_exercises" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'training_blocks', COUNT(*) FROM "training_blocks" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'session_days', COUNT(*) FROM "session_days" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'sessions', COUNT(*) FROM "sessions" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'training_models', COUNT(*) FROM "training_models" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'training_plans', COUNT(*) FROM "training_plans" WHERE DATE(created_at) = '2025-06-04'
UNION ALL
SELECT 'exercises', COUNT(*) FROM "exercises" WHERE DATE(created_at) = '2025-06-04';
*/ 