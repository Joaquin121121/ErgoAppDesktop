-- INSERT TRAINING MODELS FOR SUPABASE
-- This script creates 3 complete training models with associated plans, sessions, and exercises

-- Step 1: Insert some basic exercises (if they don't exist)
INSERT INTO "exercises" ("id", "name", "video_ref") VALUES
(gen_random_uuid(), 'Squat', 'https://example.com/squat-video'),
(gen_random_uuid(), 'Deadlift', 'https://example.com/deadlift-video'),
(gen_random_uuid(), 'Bench Press', 'https://example.com/bench-video'),
(gen_random_uuid(), 'Pull-ups', 'https://example.com/pullups-video'),
(gen_random_uuid(), 'Box Jumps', 'https://example.com/boxjumps-video'),
(gen_random_uuid(), 'Running', 'https://example.com/running-video'),
(gen_random_uuid(), 'Plank', 'https://example.com/plank-video'),
(gen_random_uuid(), 'Lunges', 'https://example.com/lunges-video')
ON CONFLICT ("id") DO NOTHING;

-- Step 2: Insert training plans, models, and all related data
DO $$
DECLARE
    plan1_id UUID := gen_random_uuid();
    plan2_id UUID := gen_random_uuid();
    plan3_id UUID := gen_random_uuid();
    model1_id UUID := gen_random_uuid();
    model2_id UUID := gen_random_uuid();
    model3_id UUID := gen_random_uuid();
    
    session1_1_id UUID := gen_random_uuid();
    session1_2_id UUID := gen_random_uuid();
    session1_3_id UUID := gen_random_uuid();
    session2_1_id UUID := gen_random_uuid();
    session2_2_id UUID := gen_random_uuid();
    session2_3_id UUID := gen_random_uuid();
    session2_4_id UUID := gen_random_uuid();
    session3_1_id UUID := gen_random_uuid();
    session3_2_id UUID := gen_random_uuid();
    
    ex_squat_id UUID;
    ex_deadlift_id UUID;
    ex_bench_id UUID;
    ex_pullups_id UUID;
    ex_boxjumps_id UUID;
    ex_running_id UUID;
    ex_plank_id UUID;
    ex_lunges_id UUID;
    
    -- Selected exercise IDs for progressions
    se_squat_id UUID := gen_random_uuid();
    se_deadlift_id UUID := gen_random_uuid();
    se_lunges_id UUID := gen_random_uuid();
    se_bench_id UUID := gen_random_uuid();
    se_pullups_id UUID := gen_random_uuid();
    se_boxjumps_id UUID := gen_random_uuid();
    se_running1_id UUID := gen_random_uuid();
    se_running2_id UUID := gen_random_uuid();
    se_plank_id UUID := gen_random_uuid();
    se_lunges2_id UUID := gen_random_uuid();
    
    coach_id UUID := '650cbaf0-8953-4412-a4dd-16f31f55bd45'::UUID;
    
BEGIN
    -- Get exercise IDs
    SELECT id INTO ex_squat_id FROM "exercises" WHERE name = 'Squat' LIMIT 1;
    SELECT id INTO ex_deadlift_id FROM "exercises" WHERE name = 'Deadlift' LIMIT 1;
    SELECT id INTO ex_bench_id FROM "exercises" WHERE name = 'Bench Press' LIMIT 1;
    SELECT id INTO ex_pullups_id FROM "exercises" WHERE name = 'Pull-ups' LIMIT 1;
    SELECT id INTO ex_boxjumps_id FROM "exercises" WHERE name = 'Box Jumps' LIMIT 1;
    SELECT id INTO ex_running_id FROM "exercises" WHERE name = 'Running' LIMIT 1;
    SELECT id INTO ex_plank_id FROM "exercises" WHERE name = 'Plank' LIMIT 1;
    SELECT id INTO ex_lunges_id FROM "exercises" WHERE name = 'Lunges' LIMIT 1;

    -- Insert training plans (4 weeks each)
    INSERT INTO "training_plans" ("id", "n_of_weeks", "n_of_sessions", "model_id", "user_id") VALUES
    (plan1_id, 4, 3, NULL, coach_id),
    (plan2_id, 4, 4, NULL, coach_id),
    (plan3_id, 4, 2, NULL, coach_id);

    -- Insert training models
    INSERT INTO "training_models" ("id", "name", "description", "training_plan_id") VALUES
    (model1_id, 'Strength & Power Development', 'Comprehensive 4-week program focused on building maximum strength and explosive power for athletes. Includes progressive overload, plyometrics, and sport-specific movements.', plan1_id),
    (model2_id, 'Endurance Base Building', 'A 4-week periodized program designed to develop aerobic capacity and muscular endurance. Perfect for endurance sports and general fitness improvement.', plan2_id),
    (model3_id, 'Injury Prevention & Mobility', 'Specialized 4-week program focusing on corrective exercises, mobility work, and injury prevention strategies for active individuals and athletes.', plan3_id);

    -- Update training plans with their corresponding model_id
    UPDATE "training_plans" SET "model_id" = model1_id WHERE "id" = plan1_id;
    UPDATE "training_plans" SET "model_id" = model2_id WHERE "id" = plan2_id;
    UPDATE "training_plans" SET "model_id" = model3_id WHERE "id" = plan3_id;

    -- Insert sessions for Model 1 - Strength & Power Development
    INSERT INTO "sessions" ("id", "plan_id", "name") VALUES
    (session1_1_id, plan1_id, 'Lower Body Strength'),
    (session1_2_id, plan1_id, 'Upper Body Power'),
    (session1_3_id, plan1_id, 'Explosive Movement');

    -- Insert sessions for Model 2 - Endurance Base Building
    INSERT INTO "sessions" ("id", "plan_id", "name") VALUES
    (session2_1_id, plan2_id, 'Aerobic Base'),
    (session2_2_id, plan2_id, 'Tempo Training'),
    (session2_3_id, plan2_id, 'Strength Endurance'),
    (session2_4_id, plan2_id, 'Recovery Session');

    -- Insert sessions for Model 3 - Injury Prevention & Mobility
    INSERT INTO "sessions" ("id", "plan_id", "name") VALUES
    (session3_1_id, plan3_id, 'Mobility & Flexibility'),
    (session3_2_id, plan3_id, 'Corrective Exercises');

    -- Insert session days
    INSERT INTO "session_days" ("id", "session_id", "day_name") VALUES
    -- Lower Body Strength (Monday, Thursday)
    (gen_random_uuid(), session1_1_id, 'Monday'),
    (gen_random_uuid(), session1_1_id, 'Thursday'),
    -- Upper Body Power (Tuesday, Friday)
    (gen_random_uuid(), session1_2_id, 'Tuesday'),
    (gen_random_uuid(), session1_2_id, 'Friday'),
    -- Explosive Movement (Wednesday, Saturday)
    (gen_random_uuid(), session1_3_id, 'Wednesday'),
    (gen_random_uuid(), session1_3_id, 'Saturday'),

    -- Endurance sessions
    (gen_random_uuid(), session2_1_id, 'Monday'),
    (gen_random_uuid(), session2_1_id, 'Wednesday'),
    (gen_random_uuid(), session2_2_id, 'Tuesday'),
    (gen_random_uuid(), session2_3_id, 'Thursday'),
    (gen_random_uuid(), session2_4_id, 'Sunday'),

    -- Mobility sessions
    (gen_random_uuid(), session3_1_id, 'Monday'),
    (gen_random_uuid(), session3_1_id, 'Wednesday'),
    (gen_random_uuid(), session3_1_id, 'Friday'),
    (gen_random_uuid(), session3_2_id, 'Tuesday'),
    (gen_random_uuid(), session3_2_id, 'Thursday'),
    (gen_random_uuid(), session3_2_id, 'Saturday');

    -- Insert selected exercises for sessions (with predefined IDs for progressions)
    -- Lower Body Strength session exercises
    INSERT INTO "selected_exercises" ("id", "session_id", "exercise_id", "series", "repetitions", "effort", "rest_time") VALUES
    (se_squat_id, session1_1_id, ex_squat_id, 4, '3-5', 85, 180),
    (se_deadlift_id, session1_1_id, ex_deadlift_id, 3, '5-6', 80, 180),
    (se_lunges_id, session1_1_id, ex_lunges_id, 3, '8-10', 70, 90);

    -- Upper Body Power session exercises
    INSERT INTO "selected_exercises" ("id", "session_id", "exercise_id", "series", "repetitions", "effort", "rest_time") VALUES
    (se_bench_id, session1_2_id, ex_bench_id, 4, '3-5', 85, 180),
    (se_pullups_id, session1_2_id, ex_pullups_id, 3, '6-8', 75, 120);

    -- Explosive Movement session exercises
    INSERT INTO "selected_exercises" ("id", "session_id", "exercise_id", "series", "repetitions", "effort", "rest_time") VALUES
    (se_boxjumps_id, session1_3_id, ex_boxjumps_id, 5, '5', 90, 120);

    -- Endurance session exercises
    INSERT INTO "selected_exercises" ("id", "session_id", "exercise_id", "series", "repetitions", "effort", "rest_time") VALUES
    (se_running1_id, session2_1_id, ex_running_id, 1, '30-45 min', 65, 0),
    (se_running2_id, session2_2_id, ex_running_id, 1, '20-25 min', 75, 0);

    -- Mobility session exercises
    INSERT INTO "selected_exercises" ("id", "session_id", "exercise_id", "series", "repetitions", "effort", "rest_time") VALUES
    (se_plank_id, session3_1_id, ex_plank_id, 3, '30-60 sec', 50, 30),
    (se_lunges2_id, session3_2_id, ex_lunges_id, 2, '12-15', 60, 60);

    -- Insert progressions for each exercise (4 weeks each)
    
    -- Squat progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_squat_id, 3, '6', 70, 1),
    (gen_random_uuid(), se_squat_id, 4, '5', 75, 2),
    (gen_random_uuid(), se_squat_id, 4, '4', 80, 3),
    (gen_random_uuid(), se_squat_id, 4, '3', 85, 4);

    -- Deadlift progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_deadlift_id, 3, '8', 65, 1),
    (gen_random_uuid(), se_deadlift_id, 3, '6', 70, 2),
    (gen_random_uuid(), se_deadlift_id, 3, '5', 75, 3),
    (gen_random_uuid(), se_deadlift_id, 4, '4', 80, 4);

    -- Lunges progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_lunges_id, 2, '12', 60, 1),
    (gen_random_uuid(), se_lunges_id, 3, '10', 65, 2),
    (gen_random_uuid(), se_lunges_id, 3, '8', 70, 3),
    (gen_random_uuid(), se_lunges_id, 3, '8', 75, 4);

    -- Bench Press progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_bench_id, 3, '6', 70, 1),
    (gen_random_uuid(), se_bench_id, 4, '5', 75, 2),
    (gen_random_uuid(), se_bench_id, 4, '4', 80, 3),
    (gen_random_uuid(), se_bench_id, 4, '3', 85, 4);

    -- Pull-ups progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_pullups_id, 3, '8', 65, 1),
    (gen_random_uuid(), se_pullups_id, 3, '7', 70, 2),
    (gen_random_uuid(), se_pullups_id, 3, '6', 75, 3),
    (gen_random_uuid(), se_pullups_id, 4, '6', 80, 4);

    -- Box Jumps progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_boxjumps_id, 4, '6', 80, 1),
    (gen_random_uuid(), se_boxjumps_id, 5, '5', 85, 2),
    (gen_random_uuid(), se_boxjumps_id, 5, '5', 90, 3),
    (gen_random_uuid(), se_boxjumps_id, 6, '4', 95, 4);

    -- Running (Aerobic Base) progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_running1_id, 1, '25 min', 60, 1),
    (gen_random_uuid(), se_running1_id, 1, '30 min', 62, 2),
    (gen_random_uuid(), se_running1_id, 1, '35 min', 65, 3),
    (gen_random_uuid(), se_running1_id, 1, '40 min', 67, 4);

    -- Running (Tempo Training) progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_running2_id, 1, '15 min', 70, 1),
    (gen_random_uuid(), se_running2_id, 1, '18 min', 72, 2),
    (gen_random_uuid(), se_running2_id, 1, '20 min', 75, 3),
    (gen_random_uuid(), se_running2_id, 1, '22 min', 77, 4);

    -- Plank progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_plank_id, 2, '20 sec', 40, 1),
    (gen_random_uuid(), se_plank_id, 3, '30 sec', 45, 2),
    (gen_random_uuid(), se_plank_id, 3, '45 sec', 50, 3),
    (gen_random_uuid(), se_plank_id, 3, '60 sec', 55, 4);

    -- Lunges (Corrective) progression (weeks 1-4)
    INSERT INTO "progressions" ("id", "selected_exercise_id", "series", "repetitions", "effort", "week_number") VALUES
    (gen_random_uuid(), se_lunges2_id, 2, '15', 50, 1),
    (gen_random_uuid(), se_lunges2_id, 2, '12', 55, 2),
    (gen_random_uuid(), se_lunges2_id, 2, '12', 60, 3),
    (gen_random_uuid(), se_lunges2_id, 3, '10', 65, 4);

END $$; 