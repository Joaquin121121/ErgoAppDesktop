-- Migration to update index logic to unified indexing system
-- This assumes the index columns already exist from a previous migration

-- ========================================
-- DROP EXISTING TRIGGERS AND FUNCTIONS
-- ========================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS auto_index_training_blocks_insert ON "training_blocks";
DROP TRIGGER IF EXISTS auto_index_selected_exercises_session_insert ON "selected_exercises";
DROP TRIGGER IF EXISTS auto_index_selected_exercises_block_insert ON "selected_exercises";
DROP TRIGGER IF EXISTS reorder_training_blocks_after_delete ON "training_blocks";
DROP TRIGGER IF EXISTS reorder_selected_exercises_session_after_delete ON "selected_exercises";
DROP TRIGGER IF EXISTS reorder_selected_exercises_block_after_delete ON "selected_exercises";

-- Drop existing functions
DROP FUNCTION IF EXISTS auto_assign_training_block_index();
DROP FUNCTION IF EXISTS auto_assign_selected_exercise_session_index();
DROP FUNCTION IF EXISTS auto_assign_selected_exercise_block_index();
DROP FUNCTION IF EXISTS reorder_training_blocks_after_delete();
DROP FUNCTION IF EXISTS reorder_selected_exercises_session_after_delete();
DROP FUNCTION IF EXISTS reorder_selected_exercises_block_after_delete();

-- ========================================
-- CREATE UNIFIED INDEX MANAGEMENT FUNCTIONS
-- ========================================

-- Function to get next available index for session-level items (training_blocks + session-level selected_exercises)
CREATE OR REPLACE FUNCTION get_next_session_index(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_block_index INTEGER;
    max_exercise_index INTEGER;
    next_index INTEGER;
BEGIN
    -- Get max index from training_blocks in this session
    SELECT COALESCE(MAX("index"), 0) INTO max_block_index
    FROM "training_blocks" 
    WHERE "session_id" = p_session_id 
    AND "deleted_at" IS NULL;
    
    -- Get max index from session-level selected_exercises (block_id IS NULL)
    SELECT COALESCE(MAX("index"), 0) INTO max_exercise_index
    FROM "selected_exercises" 
    WHERE "session_id" = p_session_id 
    AND "block_id" IS NULL
    AND "deleted_at" IS NULL;
    
    -- Return the next available index
    next_index := GREATEST(max_block_index, max_exercise_index) + 1;
    RETURN next_index;
END;
$$ LANGUAGE plpgsql;

-- Function to get next available index for block-level selected_exercises
CREATE OR REPLACE FUNCTION get_next_block_index(p_block_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_index INTEGER;
BEGIN
    SELECT COALESCE(MAX("index"), 0) + 1 INTO next_index
    FROM "selected_exercises" 
    WHERE "block_id" = p_block_id 
    AND "deleted_at" IS NULL;
    
    RETURN next_index;
END;
$$ LANGUAGE plpgsql;

-- Function to reorder session-level items after deletion
CREATE OR REPLACE FUNCTION reorder_session_items_after_delete(p_session_id UUID, p_deleted_index INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Reorder training_blocks
    UPDATE "training_blocks" 
    SET "index" = "index" - 1
    WHERE "session_id" = p_session_id 
    AND "deleted_at" IS NULL
    AND "index" > p_deleted_index;
    
    -- Reorder session-level selected_exercises
    UPDATE "selected_exercises" 
    SET "index" = "index" - 1
    WHERE "session_id" = p_session_id 
    AND "block_id" IS NULL
    AND "deleted_at" IS NULL
    AND "index" > p_deleted_index;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE NEW TRIGGER FUNCTIONS
-- ========================================

-- Auto-assign index for training_blocks on insert
CREATE OR REPLACE FUNCTION auto_assign_training_block_index()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.index = 0 THEN
        NEW.index := get_next_session_index(NEW.session_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-assign index for selected_exercises on insert
CREATE OR REPLACE FUNCTION auto_assign_selected_exercise_index()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.index = 0 THEN
        IF NEW.block_id IS NULL THEN
            -- Session-level exercise - use unified session indexing
            NEW.index := get_next_session_index(NEW.session_id);
        ELSE
            -- Block-level exercise - use block-specific indexing
            NEW.index := get_next_block_index(NEW.block_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reorder training_blocks indexes after delete
CREATE OR REPLACE FUNCTION reorder_training_blocks_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        -- Use unified session reordering
        PERFORM reorder_session_items_after_delete(NEW.session_id, OLD.index);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reorder selected_exercises indexes after delete
CREATE OR REPLACE FUNCTION reorder_selected_exercises_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        IF OLD.block_id IS NULL THEN
            -- Session-level exercise - use unified session reordering
            PERFORM reorder_session_items_after_delete(NEW.session_id, OLD.index);
        ELSE
            -- Block-level exercise - reorder within block only
            UPDATE "selected_exercises" 
            SET "index" = "index" - 1
            WHERE "block_id" = NEW.block_id 
            AND "deleted_at" IS NULL
            AND "index" > OLD.index;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE NEW TRIGGERS
-- ========================================

CREATE TRIGGER auto_index_training_blocks_insert
    BEFORE INSERT ON "training_blocks"
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_training_block_index();

CREATE TRIGGER auto_index_selected_exercises_insert
    BEFORE INSERT ON "selected_exercises"
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_selected_exercise_index();

CREATE TRIGGER reorder_training_blocks_after_delete
    AFTER UPDATE OF deleted_at ON "training_blocks"
    FOR EACH ROW
    EXECUTE FUNCTION reorder_training_blocks_after_delete();

CREATE TRIGGER reorder_selected_exercises_after_delete
    AFTER UPDATE OF deleted_at ON "selected_exercises"
    FOR EACH ROW
    EXECUTE FUNCTION reorder_selected_exercises_after_delete();

-- ========================================
-- OPTIONAL: RE-INDEX EXISTING DATA
-- ========================================

-- IMPORTANT: Only uncomment these if you want to re-index existing data
-- This will overwrite any existing index values with new unified indexing

-- Re-index training_blocks and session-level selected_exercises using unified numbering
/*
WITH session_items AS (
    -- Combine training_blocks and session-level selected_exercises
    SELECT 
        id,
        session_id,
        created_at,
        'training_block' as item_type
    FROM "training_blocks"
    WHERE deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
        id,
        session_id,
        created_at,
        'selected_exercise' as item_type
    FROM "selected_exercises"
    WHERE deleted_at IS NULL AND block_id IS NULL
),
numbered_items AS (
    SELECT 
        id,
        session_id,
        item_type,
        ROW_NUMBER() OVER (
            PARTITION BY session_id 
            ORDER BY created_at, id
        ) as row_num
    FROM session_items
)
-- Update training_blocks
UPDATE "training_blocks" 
SET "index" = numbered_items.row_num
FROM numbered_items
WHERE "training_blocks".id = numbered_items.id 
AND numbered_items.item_type = 'training_block';

-- Update session-level selected_exercises
WITH session_items AS (
    -- Combine training_blocks and session-level selected_exercises
    SELECT 
        id,
        session_id,
        created_at,
        'training_block' as item_type
    FROM "training_blocks"
    WHERE deleted_at IS NULL
    
    UNION ALL
    
    SELECT 
        id,
        session_id,
        created_at,
        'selected_exercise' as item_type
    FROM "selected_exercises"
    WHERE deleted_at IS NULL AND block_id IS NULL
),
numbered_items AS (
    SELECT 
        id,
        session_id,
        item_type,
        ROW_NUMBER() OVER (
            PARTITION BY session_id 
            ORDER BY created_at, id
        ) as row_num
    FROM session_items
)
UPDATE "selected_exercises" 
SET "index" = numbered_items.row_num
FROM numbered_items
WHERE "selected_exercises".id = numbered_items.id 
AND numbered_items.item_type = 'selected_exercise';

-- Re-index block-level selected_exercises
UPDATE "selected_exercises" 
SET "index" = subquery.row_num
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY block_id 
            ORDER BY created_at, id
        ) as row_num
    FROM "selected_exercises"
    WHERE deleted_at IS NULL AND block_id IS NOT NULL
) subquery
WHERE "selected_exercises".id = subquery.id;
*/

-- ========================================
-- VERIFICATION QUERIES (OPTIONAL)
-- ========================================

-- Uncomment these to verify the unified indexing is working:

-- Check unified session-level indexing
-- SELECT 
--     session_id,
--     'training_block' as type,
--     id,
--     name as name,
--     "index"
-- FROM training_blocks 
-- WHERE deleted_at IS NULL 
-- UNION ALL
-- SELECT 
--     session_id,
--     'selected_exercise' as type,
--     id,
--     exercise_id::text as name,
--     "index"
-- FROM selected_exercises 
-- WHERE deleted_at IS NULL AND block_id IS NULL
-- ORDER BY session_id, "index";

-- Check block-level indexing
-- SELECT block_id, id, "index"
-- FROM selected_exercises 
-- WHERE deleted_at IS NULL AND block_id IS NOT NULL
-- ORDER BY block_id, "index"; 