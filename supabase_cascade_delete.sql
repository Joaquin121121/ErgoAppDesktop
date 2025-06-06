-- CASCADE DELETE TRAINING DATA FOR SUPABASE
-- This script permanently deletes all training plans, models, and related data while preserving exercises

-- Delete in reverse dependency order to avoid foreign key constraint violations

-- 1. Delete effort reductions (depends on selected_exercises and training_blocks)
DELETE FROM "effort_reductions" 
WHERE "selected_exercise_id" IN (
    SELECT se.id FROM "selected_exercises" se 
    JOIN "sessions" s ON se.session_id = s.id 
    JOIN "training_plans" tp ON s.plan_id = tp.id
) 
OR "training_block_id" IN (
    SELECT tb.id FROM "training_blocks" tb 
    JOIN "sessions" s ON tb.session_id = s.id 
    JOIN "training_plans" tp ON s.plan_id = tp.id
);

-- 2. Delete volume reductions (depends on selected_exercises and training_blocks)
DELETE FROM "volume_reductions" 
WHERE "selected_exercise_id" IN (
    SELECT se.id FROM "selected_exercises" se 
    JOIN "sessions" s ON se.session_id = s.id 
    JOIN "training_plans" tp ON s.plan_id = tp.id
) 
OR "training_block_id" IN (
    SELECT tb.id FROM "training_blocks" tb 
    JOIN "sessions" s ON tb.session_id = s.id 
    JOIN "training_plans" tp ON s.plan_id = tp.id
);

-- 3. Delete progressions (depends on selected_exercises and training_blocks)
DELETE FROM "progressions" 
WHERE "selected_exercise_id" IN (
    SELECT se.id FROM "selected_exercises" se 
    JOIN "sessions" s ON se.session_id = s.id 
    JOIN "training_plans" tp ON s.plan_id = tp.id
) 
OR "training_block_id" IN (
    SELECT tb.id FROM "training_blocks" tb 
    JOIN "sessions" s ON tb.session_id = s.id 
    JOIN "training_plans" tp ON s.plan_id = tp.id
);

-- 4. Delete selected exercises (depends on sessions and training_blocks)
DELETE FROM "selected_exercises" 
WHERE "session_id" IN (
    SELECT s.id FROM "sessions" s 
    JOIN "training_plans" tp ON s.plan_id = tp.id
);

-- 5. Delete training blocks (depends on sessions)
DELETE FROM "training_blocks" 
WHERE "session_id" IN (
    SELECT s.id FROM "sessions" s 
    JOIN "training_plans" tp ON s.plan_id = tp.id
);

-- 6. Delete session days (depends on sessions)
DELETE FROM "session_days" 
WHERE "session_id" IN (
    SELECT s.id FROM "sessions" s 
    JOIN "training_plans" tp ON s.plan_id = tp.id
);

-- 7. Delete sessions (depends on training_plans)
DELETE FROM "sessions" 
WHERE "plan_id" IN (SELECT id FROM "training_plans");

-- 8. Handle circular reference between training_plans and training_models
-- First, remove the model_id reference from training_plans
UPDATE "training_plans" SET "model_id" = NULL;

-- 9. Delete training models
DELETE FROM "training_models";

-- 10. Delete training plans
DELETE FROM "training_plans"; 