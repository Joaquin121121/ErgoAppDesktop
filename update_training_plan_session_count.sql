-- ========================================
-- TRAINING PLAN SESSION COUNT TRIGGERS FOR SUPABASE/POSTGRESQL
-- ========================================

-- Function to update training plan session count
CREATE OR REPLACE FUNCTION update_training_plan_session_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT case
    IF TG_OP = 'INSERT' THEN
        UPDATE training_plans 
        SET n_of_sessions = (
            SELECT COUNT(*) 
            FROM sessions 
            WHERE plan_id = NEW.plan_id 
            AND deleted_at IS NULL
        )
        WHERE id = NEW.plan_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE case (soft delete/restore or plan_id change)
    IF TG_OP = 'UPDATE' THEN
        -- Check if deleted_at changed (soft delete/restore)
        IF OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN
            UPDATE training_plans 
            SET n_of_sessions = (
                SELECT COUNT(*) 
                FROM sessions 
                WHERE plan_id = NEW.plan_id 
                AND deleted_at IS NULL
            )
            WHERE id = NEW.plan_id;
        END IF;
        
        -- Check if plan_id changed (session moved between plans)
        IF OLD.plan_id != NEW.plan_id THEN
            -- Update the old plan
            UPDATE training_plans 
            SET n_of_sessions = (
                SELECT COUNT(*) 
                FROM sessions 
                WHERE plan_id = OLD.plan_id 
                AND deleted_at IS NULL
            )
            WHERE id = OLD.plan_id;
            
            -- Update the new plan
            UPDATE training_plans 
            SET n_of_sessions = (
                SELECT COUNT(*) 
                FROM sessions 
                WHERE plan_id = NEW.plan_id 
                AND deleted_at IS NULL
            )
            WHERE id = NEW.plan_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session insert
CREATE OR REPLACE TRIGGER update_plan_sessions_count_insert
    AFTER INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_training_plan_session_count();

-- Create trigger for session update (soft delete/restore and plan_id changes)
CREATE OR REPLACE TRIGGER update_plan_sessions_count_update
    AFTER UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_training_plan_session_count();

-- Optional: Initialize existing training plans with correct session counts
-- Run this once after creating the triggers to fix any existing incorrect counts
UPDATE training_plans 
SET n_of_sessions = (
    SELECT COUNT(*) 
    FROM sessions 
    WHERE sessions.plan_id = training_plans.id 
    AND sessions.deleted_at IS NULL
); 