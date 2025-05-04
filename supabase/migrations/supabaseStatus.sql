-- Migration Status: Migration to UUID primary keys

-- The following tables have been converted from bigint to UUID primary keys:
-- 1. base_result
-- 2. basic_result
-- 3. bosco_result
-- 4. drop_jump_result
-- 5. event
-- 6. jump_time
-- 7. multiple_drop_jump_result
-- 8. multiple_jumps_result

-- The following foreign key relationships have been updated:
-- 1. basic_result.base_result_id -> base_result.id
-- 2. basic_result.bosco_result_id -> bosco_result.id
-- 3. drop_jump_result.base_result_id -> base_result.id
-- 4. jump_time.base_result_id -> base_result.id
-- 5. multiple_jumps_result.base_result_id -> base_result.id

-- Remote PostgreSQL database:
-- All tables now use UUID data type with gen_random_uuid() default for id columns
-- All identity sequences have been dropped as they are no longer needed
-- All foreign key constraints have been reestablished with UUID references
-- Migration completed: 2025-05-04
-- Migration script: 20250504000000_convert_to_uuid.sql

-- Local SQLite database:
-- All tables now use TEXT data type for id columns (SQLite's equivalent of UUID)
-- All AUTOINCREMENT attributes have been removed from primary key columns
-- All foreign key references have been updated to use TEXT (UUID) references
-- UUID generation will be handled by the frontend application
-- Migration completed: 2025-05-04
-- Local schema file: parsedMigrations.sql 