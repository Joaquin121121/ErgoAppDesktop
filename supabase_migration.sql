-- Supabase Migration Script
-- WARNING: This will delete all data except from 'exercises' and 'training_plan_models' tables
-- Make sure to backup your data before running this script

-- Drop all triggers first to avoid conflicts
DROP TRIGGER IF EXISTS set_last_changed_effort_reductions ON effort_reductions;
DROP TRIGGER IF EXISTS set_last_changed_volume_reductions ON volume_reductions;
DROP TRIGGER IF EXISTS set_last_changed_progressions ON progressions;
DROP TRIGGER IF EXISTS set_last_changed_selected_exercises ON selected_exercises;
DROP TRIGGER IF EXISTS set_last_changed_training_blocks ON training_blocks;
DROP TRIGGER IF EXISTS set_last_changed_session_days ON session_days;
DROP TRIGGER IF EXISTS set_last_changed_sessions ON sessions;
DROP TRIGGER IF EXISTS set_last_changed_training_models ON training_models;
DROP TRIGGER IF EXISTS set_last_changed_training_plans ON training_plans;

-- Drop functions
DROP FUNCTION IF EXISTS update_last_changed_effort_reductions();
DROP FUNCTION IF EXISTS update_last_changed_volume_reductions();
DROP FUNCTION IF EXISTS update_last_changed_progressions();
DROP FUNCTION IF EXISTS update_last_changed_selected_exercises();
DROP FUNCTION IF EXISTS update_last_changed_training_blocks();
DROP FUNCTION IF EXISTS update_last_changed_session_days();
DROP FUNCTION IF EXISTS update_last_changed_sessions();
DROP FUNCTION IF EXISTS update_last_changed_training_models();
DROP FUNCTION IF EXISTS update_last_changed_training_plans();

-- Drop tables in reverse dependency order
-- Preserve: exercises, training_plan_models
DROP TABLE IF EXISTS effort_reductions CASCADE;
DROP TABLE IF EXISTS volume_reductions CASCADE;
DROP TABLE IF EXISTS progressions CASCADE;
DROP TABLE IF EXISTS selected_exercises CASCADE;
DROP TABLE IF EXISTS training_blocks CASCADE;
DROP TABLE IF EXISTS session_days CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS training_models CASCADE;
DROP TABLE IF EXISTS training_plans CASCADE;

-- Recreate the schema structure

-- Training plans table
CREATE TABLE "training_plans" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "n_of_weeks" INTEGER NOT NULL DEFAULT 4,
    "n_of_sessions" INTEGER NOT NULL DEFAULT 0,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ
);

-- Training models table
CREATE TABLE "training_models" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "training_plan_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE "sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE CASCADE
);

-- Session days table
CREATE TABLE "session_days" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "day_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
);

-- Training blocks table
CREATE TABLE "training_blocks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "series" INTEGER NOT NULL DEFAULT 3,
    "repetitions" TEXT NOT NULL DEFAULT '8-12',
    "effort" INTEGER NOT NULL DEFAULT 70,
    "block_model" TEXT NOT NULL DEFAULT 'sequential' CHECK (block_model IN ('sequential', 'series')),
    "comments" TEXT,
    "rest_time" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
);

-- Selected exercises table
CREATE TABLE "selected_exercises" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "block_id" UUID,
    "series" INTEGER NOT NULL DEFAULT 3,
    "repetitions" TEXT NOT NULL DEFAULT '8-12',
    "effort" INTEGER NOT NULL DEFAULT 70,
    "rest_time" INTEGER NOT NULL DEFAULT 60,
    "comments" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE,
    FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE,
    FOREIGN KEY ("block_id") REFERENCES "training_blocks"("id") ON DELETE CASCADE
);

-- Progressions table
CREATE TABLE "progressions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "selected_exercise_id" UUID,
    "training_block_id" UUID,
    "series" INTEGER NOT NULL,
    "repetitions" TEXT NOT NULL,
    "effort" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("selected_exercise_id") REFERENCES "selected_exercises"("id") ON DELETE CASCADE,
    FOREIGN KEY ("training_block_id") REFERENCES "training_blocks"("id") ON DELETE CASCADE,
    CHECK (
        (selected_exercise_id IS NOT NULL AND training_block_id IS NULL) OR
        (selected_exercise_id IS NULL AND training_block_id IS NOT NULL)
    )
);

-- Volume reductions table
CREATE TABLE "volume_reductions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "selected_exercise_id" UUID,
    "training_block_id" UUID,
    "fatigue_level" TEXT NOT NULL,
    "reduction_percentage" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("selected_exercise_id") REFERENCES "selected_exercises"("id") ON DELETE CASCADE,
    FOREIGN KEY ("training_block_id") REFERENCES "training_blocks"("id") ON DELETE CASCADE,
    CHECK (
        (selected_exercise_id IS NOT NULL AND training_block_id IS NULL) OR
        (selected_exercise_id IS NULL AND training_block_id IS NOT NULL)
    )
);

-- Effort reductions table
CREATE TABLE "effort_reductions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "selected_exercise_id" UUID,
    "training_block_id" UUID,
    "effort_level" TEXT NOT NULL,
    "reduction_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_changed" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    FOREIGN KEY ("selected_exercise_id") REFERENCES "selected_exercises"("id") ON DELETE CASCADE,
    FOREIGN KEY ("training_block_id") REFERENCES "training_blocks"("id") ON DELETE CASCADE,
    CHECK (
        (selected_exercise_id IS NOT NULL AND training_block_id IS NULL) OR
        (selected_exercise_id IS NULL AND training_block_id IS NOT NULL)
    )
);

-- Create trigger functions for updating last_changed timestamps

-- Function for training_plans
CREATE OR REPLACE FUNCTION update_last_changed_training_plans()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for training_models
CREATE OR REPLACE FUNCTION update_last_changed_training_models()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for sessions
CREATE OR REPLACE FUNCTION update_last_changed_sessions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for session_days
CREATE OR REPLACE FUNCTION update_last_changed_session_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for training_blocks
CREATE OR REPLACE FUNCTION update_last_changed_training_blocks()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for selected_exercises
CREATE OR REPLACE FUNCTION update_last_changed_selected_exercises()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for progressions
CREATE OR REPLACE FUNCTION update_last_changed_progressions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for volume_reductions
CREATE OR REPLACE FUNCTION update_last_changed_volume_reductions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for effort_reductions
CREATE OR REPLACE FUNCTION update_last_changed_effort_reductions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

CREATE TRIGGER set_last_changed_training_plans
    BEFORE UPDATE ON training_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_training_plans();

CREATE TRIGGER set_last_changed_training_models
    BEFORE UPDATE ON training_models
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_training_models();

CREATE TRIGGER set_last_changed_sessions
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_sessions();

CREATE TRIGGER set_last_changed_session_days
    BEFORE UPDATE ON session_days
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_session_days();

CREATE TRIGGER set_last_changed_training_blocks
    BEFORE UPDATE ON training_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_training_blocks();

CREATE TRIGGER set_last_changed_selected_exercises
    BEFORE UPDATE ON selected_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_selected_exercises();

CREATE TRIGGER set_last_changed_progressions
    BEFORE UPDATE ON progressions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_progressions();

CREATE TRIGGER set_last_changed_volume_reductions
    BEFORE UPDATE ON volume_reductions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_volume_reductions();

CREATE TRIGGER set_last_changed_effort_reductions
    BEFORE UPDATE ON effort_reductions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_changed_effort_reductions();

-- Performance indexes

-- Primary indexes for sync performance (last_changed fields)
CREATE INDEX idx_training_plans_last_changed ON training_plans(last_changed);
CREATE INDEX idx_training_models_last_changed ON training_models(last_changed);
CREATE INDEX idx_sessions_last_changed ON sessions(last_changed);
CREATE INDEX idx_session_days_last_changed ON session_days(last_changed);
CREATE INDEX idx_training_blocks_last_changed ON training_blocks(last_changed);
CREATE INDEX idx_selected_exercises_last_changed ON selected_exercises(last_changed);
CREATE INDEX idx_progressions_last_changed ON progressions(last_changed);
CREATE INDEX idx_volume_reductions_last_changed ON volume_reductions(last_changed);
CREATE INDEX idx_effort_reductions_last_changed ON effort_reductions(last_changed);

-- Soft deletion indexes
CREATE INDEX idx_training_plans_deleted_at ON training_plans(deleted_at);
CREATE INDEX idx_training_models_deleted_at ON training_models(deleted_at);  
CREATE INDEX idx_sessions_deleted_at ON sessions(deleted_at);
CREATE INDEX idx_session_days_deleted_at ON session_days(deleted_at);
CREATE INDEX idx_training_blocks_deleted_at ON training_blocks(deleted_at);
CREATE INDEX idx_selected_exercises_deleted_at ON selected_exercises(deleted_at);
CREATE INDEX idx_progressions_deleted_at ON progressions(deleted_at);
CREATE INDEX idx_volume_reductions_deleted_at ON volume_reductions(deleted_at);
CREATE INDEX idx_effort_reductions_deleted_at ON effort_reductions(deleted_at);

-- Foreign key indexes
CREATE INDEX idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX idx_training_models_training_plan_id ON training_models(training_plan_id);
CREATE INDEX idx_sessions_plan_id ON sessions(plan_id);
CREATE INDEX idx_session_days_session_id ON session_days(session_id);
CREATE INDEX idx_training_blocks_session_id ON training_blocks(session_id);
CREATE INDEX idx_selected_exercises_session_id ON selected_exercises(session_id);
CREATE INDEX idx_selected_exercises_exercise_id ON selected_exercises(exercise_id);
CREATE INDEX idx_selected_exercises_block_id ON selected_exercises(block_id);
CREATE INDEX idx_progressions_selected_exercise_id ON progressions(selected_exercise_id);
CREATE INDEX idx_progressions_training_block_id ON progressions(training_block_id);
CREATE INDEX idx_volume_reductions_selected_exercise_id ON volume_reductions(selected_exercise_id);
CREATE INDEX idx_volume_reductions_training_block_id ON volume_reductions(training_block_id);
CREATE INDEX idx_effort_reductions_selected_exercise_id ON effort_reductions(selected_exercise_id);
CREATE INDEX idx_effort_reductions_training_block_id ON effort_reductions(training_block_id);

-- Composite indexes for common query patterns
CREATE INDEX idx_training_plans_deleted_last_changed ON training_plans(deleted_at, last_changed);
CREATE INDEX idx_training_models_deleted_last_changed ON training_models(deleted_at, last_changed);
CREATE INDEX idx_sessions_deleted_last_changed ON sessions(deleted_at, last_changed);
CREATE INDEX idx_session_days_deleted_last_changed ON session_days(deleted_at, last_changed);
CREATE INDEX idx_training_blocks_deleted_last_changed ON training_blocks(deleted_at, last_changed);
CREATE INDEX idx_selected_exercises_deleted_last_changed ON selected_exercises(deleted_at, last_changed);
CREATE INDEX idx_progressions_deleted_last_changed ON progressions(deleted_at, last_changed);
CREATE INDEX idx_volume_reductions_deleted_last_changed ON volume_reductions(deleted_at, last_changed);
CREATE INDEX idx_effort_reductions_deleted_last_changed ON effort_reductions(deleted_at, last_changed);

-- Foreign key joins with soft deletion filtering
CREATE INDEX idx_sessions_plan_deleted ON sessions(plan_id, deleted_at);
CREATE INDEX idx_session_days_session_deleted ON session_days(session_id, deleted_at);
CREATE INDEX idx_training_blocks_session_deleted ON training_blocks(session_id, deleted_at);
CREATE INDEX idx_selected_exercises_session_deleted ON selected_exercises(session_id, deleted_at);
CREATE INDEX idx_selected_exercises_block_deleted ON selected_exercises(block_id, deleted_at);
CREATE INDEX idx_progressions_exercise_deleted ON progressions(selected_exercise_id, deleted_at);
CREATE INDEX idx_progressions_block_deleted ON progressions(training_block_id, deleted_at);
CREATE INDEX idx_volume_reductions_exercise_deleted ON volume_reductions(selected_exercise_id, deleted_at);
CREATE INDEX idx_volume_reductions_block_deleted ON volume_reductions(training_block_id, deleted_at);
CREATE INDEX idx_effort_reductions_exercise_deleted ON effort_reductions(selected_exercise_id, deleted_at);
CREATE INDEX idx_effort_reductions_block_deleted ON effort_reductions(training_block_id, deleted_at);

-- Special application indexes
CREATE INDEX idx_training_plans_user_deleted ON training_plans(user_id, deleted_at);
CREATE INDEX idx_training_models_plan_deleted ON training_models(training_plan_id, deleted_at);
CREATE INDEX idx_progressions_week_number ON progressions(week_number);
CREATE INDEX idx_selected_exercises_exercise_session ON selected_exercises(exercise_id, session_id);

-- Covering indexes for sync queries
CREATE INDEX idx_training_plans_sync_cover ON training_plans(last_changed, id, deleted_at);
CREATE INDEX idx_sessions_sync_cover ON sessions(last_changed, id, plan_id, deleted_at);

-- Note: This script preserves 'exercises' and 'training_plan_models' tables
-- All other tables and their data will be recreated from scratch 