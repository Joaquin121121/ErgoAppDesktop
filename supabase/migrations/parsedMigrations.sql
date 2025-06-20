-- SQLite version of public schema tables

-- Function replacement for set_last_changed
-- SQLite doesn't support functions like PostgreSQL, but we can use triggers to achieve similar functionality

-- Base tables

CREATE TABLE IF NOT EXISTS "athlete" (
    "id" UUID PRIMARY KEY,
    "coach_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "birth_date" TEXT,
    "country" TEXT,
    "state" TEXT,
    "gender" TEXT CHECK (gender IN ('M', 'F', 'O', '')),
    "height" TEXT,
    "height_unit" TEXT CHECK (height_unit IN ('cm', 'ft')),
    "weight" TEXT,
    "weight_unit" TEXT CHECK (weight_unit IN ('kgs', 'lbs')),
    "discipline" TEXT,
    "category" TEXT,
    "institution" TEXT,
    "comments" TEXT,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("coach_id") REFERENCES "coach"("id")
);

CREATE TABLE IF NOT EXISTS "coach" (
    "email" TEXT NOT NULL UNIQUE,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "info" TEXT,
    "specialty" TEXT,
    "id" UUID PRIMARY KEY,
    "created_at" TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "base_result" (
    "id" UUID PRIMARY KEY,
    "takeoff_foot" TEXT NOT NULL CHECK (takeoff_foot IN ('right', 'left', 'both')),
    "sensitivity" REAL NOT NULL,
    "created_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "athlete_id" UUID NOT NULL,
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "basic_result" (
    "id" UUID PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "type" TEXT NOT NULL CHECK (type IN ('cmj', 'abalakov', 'squatJump', 'custom')),
    "load" REAL NOT NULL,
    "loadunit" TEXT NOT NULL CHECK (loadunit IN ('kgs', 'lbs')),
    "base_result_id" UUID NOT NULL,
    "bosco_result_id" UUID,
    FOREIGN KEY ("base_result_id") REFERENCES "base_result"("id"),
    FOREIGN KEY ("bosco_result_id") REFERENCES "bosco_result"("id")
);

CREATE TABLE IF NOT EXISTS "bosco_result" (
    "id" UUID PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "athlete_id" UUID,
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "drop_jump_result" (
    "id" UUID PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "height" TEXT NOT NULL,
    "stiffness" NUMERIC NOT NULL,
    "base_result_id" UUID NOT NULL,
    "multiple_drop_jump_id" UUID,
    FOREIGN KEY ("base_result_id") REFERENCES "base_result"("id"),
    FOREIGN KEY ("multiple_drop_jump_id") REFERENCES "multiple_drop_jump_result"("id")
);

CREATE TABLE IF NOT EXISTS "event" (
    "id" UUID PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" TIMESTAMP NOT NULL,
    "duration" INTEGER,
    "last_changed" TIMESTAMP,
    "coach_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "athlete_id" UUID NOT NULL,
    FOREIGN KEY ("coach_id") REFERENCES "coach"("id"),
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "jump_time" (
    "id" UUID PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "base_result_id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "time" REAL NOT NULL,
    "deleted" BOOLEAN NOT NULL,
    "floor_time" REAL,
    "stiffness" REAL,
    "performance" REAL,
    "last_changed" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("base_result_id") REFERENCES "base_result"("id")
);

CREATE TABLE IF NOT EXISTS "multiple_drop_jump_result" (
    "id" UUID PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "height_unit" TEXT NOT NULL CHECK (height_unit IN ('cm', 'ft')),
    "takeoff_foot" TEXT NOT NULL CHECK (takeoff_foot IN ('right', 'left', 'both')),
    "best_height" TEXT NOT NULL,
    "athlete_id" UUID NOT NULL,
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "multiple_jumps_result" (
    "id" UUID PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "criteria" TEXT NOT NULL CHECK (criteria IN ('numberOfJumps', 'stiffness', 'time')),
    "criteria_value" NUMERIC,
    "base_result_id" UUID NOT NULL,
    FOREIGN KEY ("base_result_id") REFERENCES "base_result"("id")
);

-- Triggers to simulate last_changed functionality

-- athlete table
CREATE TRIGGER IF NOT EXISTS set_last_changed_athlete
AFTER UPDATE ON "athlete"
BEGIN
    UPDATE "athlete" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- base_result table
CREATE TRIGGER IF NOT EXISTS set_last_changed_base_result
AFTER UPDATE ON "base_result"
BEGIN
    UPDATE "base_result" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- basic_result table
CREATE TRIGGER IF NOT EXISTS set_last_changed_basic_result
AFTER UPDATE ON "basic_result"
BEGIN
    UPDATE "basic_result" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- bosco_result table
CREATE TRIGGER IF NOT EXISTS set_last_changed_bosco_result
AFTER UPDATE ON "bosco_result"
BEGIN
    UPDATE "bosco_result" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- coach table
CREATE TRIGGER IF NOT EXISTS set_last_changed_coach
AFTER UPDATE ON "coach"
BEGIN
    UPDATE "coach" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- drop_jump_result table
CREATE TRIGGER IF NOT EXISTS set_last_changed_drop_jump_result
AFTER UPDATE ON "drop_jump_result"
BEGIN
    UPDATE "drop_jump_result" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- event table
CREATE TRIGGER IF NOT EXISTS set_last_changed_event
AFTER UPDATE ON "event"
BEGIN
    UPDATE "event" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- jump_time table
CREATE TRIGGER IF NOT EXISTS set_last_changed_jump_time
AFTER UPDATE ON "jump_time"
BEGIN
    UPDATE "jump_time" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- multiple_drop_jump_result table
CREATE TRIGGER IF NOT EXISTS set_last_changed_multiple_drop_jump_result
AFTER UPDATE ON "multiple_drop_jump_result"
BEGIN
    UPDATE "multiple_drop_jump_result" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- multiple_jumps_result table
CREATE TRIGGER IF NOT EXISTS set_last_changed_multiple_jumps_result
AFTER UPDATE ON "multiple_jumps_result"
BEGIN
    UPDATE "multiple_jumps_result" SET last_changed = CURRENT_TIMESTAMP WHERE id = NEW.id;
END; 

/* -- Insert coach data
INSERT OR REPLACE INTO "coach" ("email", "first_name", "last_name", "info", "specialty", "id", "created_at", "last_changed", "deleted_at")
VALUES
  ('joaquindelrio16@gmail.com', 'Joaquin', 'Del Rio', 'Entrenador de natacion', 'Fuerza', '650cbaf0-8953-4412-a4dd-16f31f55bd45', '2025-04-28T15:30:00+00:00', '2025-04-28T15:30:00+00:00', NULL);

-- Insert athletes data
INSERT OR REPLACE INTO "athlete" ("id", "coach_id", "name", "birth_date", "country", "state", "gender", "height", "height_unit", "weight", "weight_unit", "discipline", "category", "institution", "comments", "last_changed", "deleted_at", "created_at")
VALUES
  ('f48c9a39-4b15-46ba-9660-ce039bb69d6a', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Anibal', '2008-07-17', 'AR', 'X', 'M', '167', 'cm', '67', 'kgs', 'football', '1', 'IACC', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('6b8d39ed-eaa6-4c53-8029-f1b26350241a', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Joaquin Del Rio', '2025-02-21', 'AR', 'X', 'M', '180', 'cm', '80', 'kgs', 'football', 'U21', '', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('a059a631-5028-4fe3-8f63-fbd63d1e751d', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Manuel Alzamora', '2003-11-25', 'AR', 'X', 'F', '48', 'cm', '44', 'kgs', 'football', 'dssd', 'zxdd', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('21111ca4-e82c-4928-95a2-6fcab68b4a25', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Bruno Lalomia', '2025-02-21', 'AR', 'X', 'M', '181', 'cm', '100', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('c3380d97-71bf-4556-b43f-143b153974db', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Adriel Zarate', '2025-02-21', 'AR', 'X', 'M', '172', 'cm', '68', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('2ead77e7-531a-46e4-8b44-069b02723443', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Diego Nivela', '2025-02-21', 'AR', 'X', 'M', '173', 'cm', '76', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('9065801b-bb42-404e-a2bd-dee42a184570', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Santino Williams', '2025-02-21', 'AR', 'X', 'M', '165', 'cm', '74', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('703b3006-f0e8-46fc-8cc3-dc21f8d3b024', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Federico Unsain', '2025-02-21', 'AR', 'X', 'M', '179', 'cm', '75', 'kgs', 'basketball', 'Coach', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('ebe9b04e-40b7-499a-aeae-f9a5b7d11cc1', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Ignacio Nivela', '2025-02-21', 'AR', 'X', 'M', '185', 'cm', '81', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('f8fcc504-fa7a-4f91-84bc-a39256f874f5', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Lautaro Moyano', '2025-02-21', 'AR', 'X', 'M', '175', 'cm', '72', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('1dcc3820-7ae1-4fa5-ba46-bc5a861f55a4', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Gabriel Loza', '2025-02-21', 'AR', 'X', 'M', '168', 'cm', '65', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('610f2e32-bb4c-480b-8b6c-9d2babcad909', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Santiago Dreher', '2025-02-21', 'AR', 'X', 'M', '178', 'cm', '90', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('59af8a4e-45ed-489a-bb8e-4f5c277dbe9b', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Illanes', '2025-02-21', 'AR', 'X', 'M', '182', 'cm', '115', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('c9583cc8-f3cc-42d9-8ea5-c7946de01ac2', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Rivas', '2025-02-21', 'AR', 'X', 'M', '168', 'cm', '70', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('d0e8e1f7-b78a-41af-a5f2-c3bd8ca4768d', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Julio Castillo', '2025-02-21', 'AR', 'X', 'M', '173', 'cm', '90', 'kgs', 'roadCycling', 'Amateur', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('29f7e9c1-1916-4b6c-ab33-1a6a0882cd9b', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Valentin Amaranto', '2025-02-21', 'AR', 'X', 'M', '174', 'cm', '70', 'kgs', 'basketball', 'U21', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('ea2cf47f-14aa-4c69-8693-9a9730c7c039', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Marcelo Dominguez', '2025-02-21', 'AR', 'X', 'M', '175', 'cm', '93', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('c4c9f2e0-a88d-40ad-9997-d6851701ea0c', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Lautaro Rincon', '2025-02-21', 'AR', 'X', 'M', '175', 'cm', '95', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('78de8d59-54aa-4502-9638-c3ce17a97772', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Juan Loza', '2025-02-21', 'AR', 'X', 'M', '166', 'cm', '63', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00'),
  ('ab22dcad-f079-474e-9b2f-0e1df5a9e03a', '650cbaf0-8953-4412-a4dd-16f31f55bd45', 'Lauti Garay', '2025-02-21', 'AR', 'X', 'M', '168', 'cm', '110', 'kgs', 'basketball', 'Primera', 'Las Palmas', '', '2025-04-27T19:18:43.394859+00:00', NULL, '2025-04-28T15:35:18.408741+00:00');   */
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
    "athlete_id" UUID,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "coach"("id"),
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
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
CREATE INDEX IF NOT EXISTS idx_progressions_week_number ON "progressions"("week_number");
CREATE INDEX IF NOT EXISTS idx_selected_exercises_exercise_session ON "selected_exercises"("exercise_id", "session_id");

-- Covering indexes for sync metadata queries (include commonly selected columns)
CREATE INDEX IF NOT EXISTS idx_training_plans_sync_cover ON "training_plans"("last_changed", "id", "deleted_at");
CREATE INDEX IF NOT EXISTS idx_sessions_sync_cover ON "sessions"("last_changed", "id", "plan_id", "deleted_at");

-- ========================================
-- CASCADING SOFT DELETE TRIGGERS
-- ========================================

-- These triggers ensure that when a parent record is soft-deleted (i.e., `deleted_at` is set),
-- the soft deletion cascades to all its children, maintaining data integrity.
-- They also handle the "un-deletion" case, where setting `deleted_at` to NULL on the parent
-- will also propagate NULL to the children.

-- Parent: athlete
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_athlete
AFTER UPDATE OF deleted_at ON "athlete"
FOR EACH ROW
BEGIN
    UPDATE "base_result" SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
    UPDATE "bosco_result" SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
    UPDATE "event" SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
    UPDATE "multiple_drop_jump_result" SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
END;

-- Parent: base_result
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_base_result
AFTER UPDATE OF deleted_at ON "base_result"
FOR EACH ROW
BEGIN
    UPDATE "basic_result" SET deleted_at = NEW.deleted_at WHERE base_result_id = NEW.id;
    UPDATE "drop_jump_result" SET deleted_at = NEW.deleted_at WHERE base_result_id = NEW.id;
    UPDATE "jump_time" SET deleted_at = NEW.deleted_at WHERE base_result_id = NEW.id;
    UPDATE "multiple_jumps_result" SET deleted_at = NEW.deleted_at WHERE base_result_id = NEW.id;
END;

-- Parent: bosco_result
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_bosco_result
AFTER UPDATE OF deleted_at ON "bosco_result"
FOR EACH ROW
BEGIN
    UPDATE "basic_result" SET deleted_at = NEW.deleted_at WHERE bosco_result_id = NEW.id;
END;

-- Parent: multiple_drop_jump_result
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_multiple_drop_jump_result
AFTER UPDATE OF deleted_at ON "multiple_drop_jump_result"
FOR EACH ROW
BEGIN
    UPDATE "drop_jump_result" SET deleted_at = NEW.deleted_at WHERE multiple_drop_jump_id = NEW.id;
END;

-- Parent: training_plans
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_training_plans
AFTER UPDATE OF deleted_at ON "training_plans"
FOR EACH ROW
BEGIN
    UPDATE "training_models" SET deleted_at = NEW.deleted_at WHERE training_plan_id = NEW.id;
    UPDATE "sessions" SET deleted_at = NEW.deleted_at WHERE plan_id = NEW.id;
END;

-- Parent: sessions
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_sessions
AFTER UPDATE OF deleted_at ON "sessions"
FOR EACH ROW
BEGIN
    UPDATE "session_days" SET deleted_at = NEW.deleted_at WHERE session_id = NEW.id;
    UPDATE "training_blocks" SET deleted_at = NEW.deleted_at WHERE session_id = NEW.id;
    UPDATE "selected_exercises" SET deleted_at = NEW.deleted_at WHERE session_id = NEW.id;
END;

-- Parent: training_blocks
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_training_blocks
AFTER UPDATE OF deleted_at ON "training_blocks"
FOR EACH ROW
BEGIN
    UPDATE "selected_exercises" SET deleted_at = NEW.deleted_at WHERE block_id = NEW.id;
    UPDATE "progressions" SET deleted_at = NEW.deleted_at WHERE training_block_id = NEW.id;
    UPDATE "volume_reductions" SET deleted_at = NEW.deleted_at WHERE training_block_id = NEW.id;
    UPDATE "effort_reductions" SET deleted_at = NEW.deleted_at WHERE training_block_id = NEW.id;
END;

-- Parent: exercises
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_exercises
AFTER UPDATE OF deleted_at ON "exercises"
FOR EACH ROW
BEGIN
    UPDATE "selected_exercises" SET deleted_at = NEW.deleted_at WHERE exercise_id = NEW.id;
END;

-- Parent: selected_exercises
CREATE TRIGGER IF NOT EXISTS cascade_soft_delete_selected_exercises
AFTER UPDATE OF deleted_at ON "selected_exercises"
FOR EACH ROW
BEGIN
    UPDATE "progressions" SET deleted_at = NEW.deleted_at WHERE selected_exercise_id = NEW.id;
    UPDATE "volume_reductions" SET deleted_at = NEW.deleted_at WHERE selected_exercise_id = NEW.id;
    UPDATE "effort_reductions" SET deleted_at = NEW.deleted_at WHERE selected_exercise_id = NEW.id;
END; 