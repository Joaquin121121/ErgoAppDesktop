-- SQLite version of training plan schema
-- Simplified version with soft deletion

-- Base exercises table
CREATE TABLE IF NOT EXISTS "exercises" (
    "id" UUID PRIMARY KEY,
    "name" TEXT NOT NULL,
    "video_ref" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP
);

-- Training plans table
CREATE TABLE IF NOT EXISTS "training_plans" (
    "id" UUID PRIMARY KEY,
    "n_of_weeks" INTEGER NOT NULL DEFAULT 4,
    "n_of_sessions" INTEGER NOT NULL DEFAULT 0,
    "user_id" UUID,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "coach"("id")
);

-- Training models table
CREATE TABLE IF NOT EXISTS "training_models" (
    "id" UUID PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "training_plan_id" UUID NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id")
);

-- Training plan models relationship table
CREATE TABLE IF NOT EXISTS "training_plan_models" (
    "training_plan_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    PRIMARY KEY ("training_plan_id", "model_id"),
    FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id"),
    FOREIGN KEY ("model_id") REFERENCES "training_models"("id")
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" UUID PRIMARY KEY,
    "plan_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id")
);

-- Session days table (for the days array)
CREATE TABLE IF NOT EXISTS "session_days" (
    "id" UUID PRIMARY KEY,
    "session_id" UUID NOT NULL,
    "day_name" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
);

-- Training blocks table
CREATE TABLE IF NOT EXISTS "training_blocks" (
    "id" UUID PRIMARY KEY,
    "session_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "series" INTEGER NOT NULL DEFAULT 3,
    "repetitions" TEXT NOT NULL DEFAULT '8-12',
    "effort" INTEGER NOT NULL DEFAULT 70,
    "block_model" TEXT NOT NULL DEFAULT 'sequential' CHECK (block_model IN ('sequential', 'series')),
    "comments" TEXT,
    "rest_time" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
);

-- Selected exercises table
CREATE TABLE IF NOT EXISTS "selected_exercises" (
    "id" UUID PRIMARY KEY,
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "block_id" UUID, -- NULL if exercise is directly in session
    "series" INTEGER NOT NULL DEFAULT 3,
    "repetitions" TEXT NOT NULL DEFAULT '8-12',
    "effort" INTEGER NOT NULL DEFAULT 70,
    "rest_time" INTEGER NOT NULL DEFAULT 60,
    "comments" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id"),
    FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id"),
    FOREIGN KEY ("block_id") REFERENCES "training_blocks"("id")
);

-- Progressions table (for both selected exercises and training blocks)
CREATE TABLE IF NOT EXISTS "progressions" (
    "id" UUID PRIMARY KEY,
    "selected_exercise_id" UUID,
    "training_block_id" UUID,
    "series" INTEGER NOT NULL,
    "repetitions" TEXT NOT NULL,
    "effort" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL DEFAULT 1, -- To maintain order of progressions
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("selected_exercise_id") REFERENCES "selected_exercises"("id"),
    FOREIGN KEY ("training_block_id") REFERENCES "training_blocks"("id"),
    
    -- Ensure progression belongs to either exercise or block, not both
    CHECK (
        (selected_exercise_id IS NOT NULL AND training_block_id IS NULL) OR
        (selected_exercise_id IS NULL AND training_block_id IS NOT NULL)
    )
);

-- Volume reductions table
CREATE TABLE IF NOT EXISTS "volume_reductions" (
    "id" UUID PRIMARY KEY,
    "selected_exercise_id" UUID,
    "training_block_id" UUID,
    "fatigue_level" TEXT NOT NULL,
    "reduction_percentage" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("selected_exercise_id") REFERENCES "selected_exercises"("id"),
    FOREIGN KEY ("training_block_id") REFERENCES "training_blocks"("id"),
    
    -- Ensure reduction belongs to either exercise or block, not both
    CHECK (
        (selected_exercise_id IS NOT NULL AND training_block_id IS NULL) OR
        (selected_exercise_id IS NULL AND training_block_id IS NOT NULL)
    )
);

-- Effort reductions table
CREATE TABLE IF NOT EXISTS "effort_reductions" (
    "id" UUID PRIMARY KEY,
    "selected_exercise_id" UUID,
    "training_block_id" UUID,
    "effort_level" TEXT NOT NULL,
    "reduction_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("selected_exercise_id") REFERENCES "selected_exercises"("id"),
    FOREIGN KEY ("training_block_id") REFERENCES "training_blocks"("id"),
    
    -- Ensure reduction belongs to either exercise or block, not both
    CHECK (
        (selected_exercise_id IS NOT NULL AND training_block_id IS NULL) OR
        (selected_exercise_id IS NULL AND training_block_id IS NOT NULL)
    )
);

-- Triggers to simulate last_changed functionality

-- exercises table
CREATE TRIGGER IF NOT EXISTS set_last_changed_exercises
AFTER UPDATE ON "exercises"
BEGIN
    UPDATE "exercises" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- training_plans table
CREATE TRIGGER IF NOT EXISTS set_last_changed_training_plans
AFTER UPDATE ON "training_plans"
BEGIN
    UPDATE "training_plans" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- training_models table
CREATE TRIGGER IF NOT EXISTS set_last_changed_training_models
AFTER UPDATE ON "training_models"
BEGIN
    UPDATE "training_models" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- training_plan_models table
CREATE TRIGGER IF NOT EXISTS set_last_changed_training_plan_models
AFTER UPDATE ON "training_plan_models"
BEGIN
    UPDATE "training_plan_models" SET last_changed = CURRENT_TIMESTAMP 
    WHERE training_plan_id = NEW.training_plan_id AND model_id = NEW.model_id;
END;

-- sessions table
CREATE TRIGGER IF NOT EXISTS set_last_changed_sessions
AFTER UPDATE ON "sessions"
BEGIN
    UPDATE "sessions" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- session_days table
CREATE TRIGGER IF NOT EXISTS set_last_changed_session_days
AFTER UPDATE ON "session_days"
BEGIN
    UPDATE "session_days" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- training_blocks table
CREATE TRIGGER IF NOT EXISTS set_last_changed_training_blocks
AFTER UPDATE ON "training_blocks"
BEGIN
    UPDATE "training_blocks" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- selected_exercises table
CREATE TRIGGER IF NOT EXISTS set_last_changed_selected_exercises
AFTER UPDATE ON "selected_exercises"
BEGIN
    UPDATE "selected_exercises" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- progressions table
CREATE TRIGGER IF NOT EXISTS set_last_changed_progressions
AFTER UPDATE ON "progressions"
BEGIN
    UPDATE "progressions" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- volume_reductions table
CREATE TRIGGER IF NOT EXISTS set_last_changed_volume_reductions
AFTER UPDATE ON "volume_reductions"
BEGIN
    UPDATE "volume_reductions" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- effort_reductions table
CREATE TRIGGER IF NOT EXISTS set_last_changed_effort_reductions
AFTER UPDATE ON "effort_reductions"
BEGIN
    UPDATE "effort_reductions" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Primary indexes for sync performance (last_changed fields)
-- These are critical for incremental sync operations
CREATE INDEX IF NOT EXISTS idx_exercises_last_changed ON "exercises"("last_changed");
CREATE INDEX IF NOT EXISTS idx_training_plans_last_changed ON "training_plans"("last_changed");
CREATE INDEX IF NOT EXISTS idx_training_models_last_changed ON "training_models"("last_changed");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_last_changed ON "training_plan_models"("last_changed");
CREATE INDEX IF NOT EXISTS idx_sessions_last_changed ON "sessions"("last_changed");
CREATE INDEX IF NOT EXISTS idx_session_days_last_changed ON "session_days"("last_changed");
CREATE INDEX IF NOT EXISTS idx_training_blocks_last_changed ON "training_blocks"("last_changed");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_last_changed ON "selected_exercises"("last_changed");
CREATE INDEX IF NOT EXISTS idx_progressions_last_changed ON "progressions"("last_changed");
CREATE INDEX IF NOT EXISTS idx_volume_reductions_last_changed ON "volume_reductions"("last_changed");
CREATE INDEX IF NOT EXISTS idx_effort_reductions_last_changed ON "effort_reductions"("last_changed");

-- Soft deletion indexes (deleted_at fields)
-- These optimize queries that filter out deleted records
CREATE INDEX IF NOT EXISTS idx_exercises_deleted_at ON "exercises"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_plans_deleted_at ON "training_plans"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_models_deleted_at ON "training_models"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_deleted_at ON "training_plan_models"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON "sessions"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_session_days_deleted_at ON "session_days"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_blocks_deleted_at ON "training_blocks"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_deleted_at ON "selected_exercises"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_progressions_deleted_at ON "progressions"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_volume_reductions_deleted_at ON "volume_reductions"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_effort_reductions_deleted_at ON "effort_reductions"("deleted_at");

-- Foreign key indexes for join performance
CREATE INDEX IF NOT EXISTS idx_training_plans_user_id ON "training_plans"("user_id");
CREATE INDEX IF NOT EXISTS idx_training_models_training_plan_id ON "training_models"("training_plan_id");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_training_plan_id ON "training_plan_models"("training_plan_id");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_model_id ON "training_plan_models"("model_id");
CREATE INDEX IF NOT EXISTS idx_sessions_plan_id ON "sessions"("plan_id");
CREATE INDEX IF NOT EXISTS idx_session_days_session_id ON "session_days"("session_id");
CREATE INDEX IF NOT EXISTS idx_training_blocks_session_id ON "training_blocks"("session_id");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_session_id ON "selected_exercises"("session_id");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_exercise_id ON "selected_exercises"("exercise_id");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_block_id ON "selected_exercises"("block_id");
CREATE INDEX IF NOT EXISTS idx_progressions_selected_exercise_id ON "progressions"("selected_exercise_id");
CREATE INDEX IF NOT EXISTS idx_progressions_training_block_id ON "progressions"("training_block_id");
CREATE INDEX IF NOT EXISTS idx_volume_reductions_selected_exercise_id ON "volume_reductions"("selected_exercise_id");
CREATE INDEX IF NOT EXISTS idx_volume_reductions_training_block_id ON "volume_reductions"("training_block_id");
CREATE INDEX IF NOT EXISTS idx_effort_reductions_selected_exercise_id ON "effort_reductions"("selected_exercise_id");
CREATE INDEX IF NOT EXISTS idx_effort_reductions_training_block_id ON "effort_reductions"("training_block_id");

-- Composite indexes for common query patterns
-- These optimize the most frequent sync and data retrieval operations

-- For filtering non-deleted records with time-based queries
CREATE INDEX IF NOT EXISTS idx_exercises_deleted_last_changed ON "exercises"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_training_plans_deleted_last_changed ON "training_plans"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_training_models_deleted_last_changed ON "training_models"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_deleted_last_changed ON "training_plan_models"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_last_changed ON "sessions"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_session_days_deleted_last_changed ON "session_days"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_training_blocks_deleted_last_changed ON "training_blocks"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_deleted_last_changed ON "selected_exercises"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_progressions_deleted_last_changed ON "progressions"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_volume_reductions_deleted_last_changed ON "volume_reductions"("deleted_at", "last_changed");
CREATE INDEX IF NOT EXISTS idx_effort_reductions_deleted_last_changed ON "effort_reductions"("deleted_at", "last_changed");

-- For foreign key joins with soft deletion filtering
CREATE INDEX IF NOT EXISTS idx_sessions_plan_deleted ON "sessions"("plan_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_session_days_session_deleted ON "session_days"("session_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_blocks_session_deleted ON "training_blocks"("session_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_session_deleted ON "selected_exercises"("session_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_block_deleted ON "selected_exercises"("block_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_progressions_exercise_deleted ON "progressions"("selected_exercise_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_progressions_block_deleted ON "progressions"("training_block_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_volume_reductions_exercise_deleted ON "volume_reductions"("selected_exercise_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_volume_reductions_block_deleted ON "volume_reductions"("training_block_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_effort_reductions_exercise_deleted ON "effort_reductions"("selected_exercise_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_effort_reductions_block_deleted ON "effort_reductions"("training_block_id", "deleted_at");

-- Special indexes for common application queries
CREATE INDEX IF NOT EXISTS idx_training_plans_user_deleted ON "training_plans"("user_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_models_plan_deleted ON "training_models"("training_plan_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_plan_deleted ON "training_plan_models"("training_plan_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_model_deleted ON "training_plan_models"("model_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_progressions_week_number ON "progressions"("week_number");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_exercise_session ON "selected_exercises"("exercise_id", "session_id");

-- Covering indexes for sync metadata queries (include commonly selected columns)
CREATE INDEX IF NOT EXISTS idx_training_plans_sync_cover ON "training_plans"("last_changed", "id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_training_plan_models_sync_cover ON "training_plan_models"("last_changed", "training_plan_id", "model_id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_sessions_sync_cover ON "sessions"("last_changed", "id", "plan_id", "deleted_at"); 