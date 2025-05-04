-- SQLite version of public schema tables

-- Function replacement for set_last_changed
-- SQLite doesn't support functions like PostgreSQL, but we can use triggers to achieve similar functionality

-- Base tables

CREATE TABLE IF NOT EXISTS "athlete" (
    "id" TEXT PRIMARY KEY,
    "coach_id" TEXT NOT NULL,
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
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "base_result" (
    "id" TEXT PRIMARY KEY,
    "takeoff_foot" TEXT NOT NULL CHECK (takeoff_foot IN ('right', 'left', 'both')),
    "sensitivity" REAL NOT NULL,
    "created_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "athlete_id" TEXT NOT NULL,
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "basic_result" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "type" TEXT NOT NULL CHECK (type IN ('cmj', 'abalakov', 'squatJump', 'custom')),
    "load" REAL NOT NULL,
    "loadunit" TEXT NOT NULL CHECK (loadunit IN ('kgs', 'lbs')),
    "base_result_id" TEXT NOT NULL,
    "bosco_result_id" TEXT,
    FOREIGN KEY ("base_result_id") REFERENCES "base_result"("id"),
    FOREIGN KEY ("bosco_result_id") REFERENCES "bosco_result"("id")
);

CREATE TABLE IF NOT EXISTS "bosco_result" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "athlete_id" TEXT,
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "drop_jump_result" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "height" TEXT NOT NULL,
    "stiffness" NUMERIC NOT NULL,
    "base_result_id" TEXT NOT NULL,
    FOREIGN KEY ("base_result_id") REFERENCES "base_result"("id")
);

CREATE TABLE IF NOT EXISTS "event" (
    "id" TEXT PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" TIMESTAMP NOT NULL,
    "duration" INTEGER,
    "last_changed" TIMESTAMP,
    "coach_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "athlete_id" TEXT NOT NULL,
    FOREIGN KEY ("coach_id") REFERENCES "coach"("id"),
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "jump_time" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "base_result_id" TEXT NOT NULL,
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
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "height_unit" TEXT NOT NULL CHECK (height_unit IN ('cm', 'ft')),
    "takeoff_foot" TEXT NOT NULL CHECK (takeoff_foot IN ('right', 'left', 'both')),
    "best_height" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    FOREIGN KEY ("athlete_id") REFERENCES "athlete"("id")
);

CREATE TABLE IF NOT EXISTS "multiple_jumps_result" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_changed" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    "criteria" TEXT NOT NULL CHECK (criteria IN ('numberOfJumps', 'stiffness', 'time')),
    "criteria_value" NUMERIC,
    "base_result_id" TEXT NOT NULL,
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