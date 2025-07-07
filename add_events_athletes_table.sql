-- PostgreSQL migration to add events_athletes junction table
-- This creates a many-to-many relationship between events and athletes

-- Create the events_athletes junction table
DROP TABLE IF EXISTS public.events_athletes CASCADE;
CREATE TABLE public.events_athletes (
    event_id UUID NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.athlete(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_changed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Composite primary key ensures unique event-athlete pairs
    PRIMARY KEY (event_id, athlete_id)
);

-- Create function to automatically update last_changed timestamp
CREATE OR REPLACE FUNCTION public.set_last_changed_events_athletes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_changed = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_changed timestamp
DROP TRIGGER IF EXISTS set_last_changed_events_athletes ON public.events_athletes;
CREATE TRIGGER set_last_changed_events_athletes
    BEFORE UPDATE ON public.events_athletes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_last_changed_events_athletes();

-- Create cascading soft delete trigger for events
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_event_athletes()
RETURNS TRIGGER AS $$
BEGIN
    -- When an event is soft deleted, soft delete all its athlete relationships
    IF OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN
        UPDATE public.events_athletes 
        SET deleted_at = NEW.deleted_at 
        WHERE event_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event soft deletion
DROP TRIGGER IF EXISTS cascade_soft_delete_event_athletes ON public.event;
CREATE TRIGGER cascade_soft_delete_event_athletes
    AFTER UPDATE OF deleted_at ON public.event
    FOR EACH ROW
    EXECUTE FUNCTION public.cascade_soft_delete_event_athletes();

-- Update the existing athlete soft delete trigger to handle events_athletes
-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS cascade_soft_delete_athlete ON public.athlete;

-- Create updated cascading soft delete function for athletes
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_athlete()
RETURNS TRIGGER AS $$
BEGIN
    -- When an athlete is soft deleted, soft delete all related records
    IF OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN
        UPDATE public.base_result SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
        UPDATE public.bosco_result SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
        UPDATE public.events_athletes SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
        UPDATE public.multiple_drop_jump_result SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
        UPDATE public.athlete_weekly_stats SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
        UPDATE public.athlete_session_performance SET deleted_at = NEW.deleted_at WHERE athlete_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the athlete soft delete trigger
DROP TRIGGER IF EXISTS cascade_soft_delete_athlete ON public.athlete;
CREATE TRIGGER cascade_soft_delete_athlete
    AFTER UPDATE OF deleted_at ON public.athlete
    FOR EACH ROW
    EXECUTE FUNCTION public.cascade_soft_delete_athlete();

-- Create performance indexes for sync operations
DROP INDEX IF EXISTS public.idx_events_athletes_last_changed;
CREATE INDEX idx_events_athletes_last_changed ON public.events_athletes(last_changed);

DROP INDEX IF EXISTS public.idx_events_athletes_deleted_at;
CREATE INDEX idx_events_athletes_deleted_at ON public.events_athletes(deleted_at);

DROP INDEX IF EXISTS public.idx_events_athletes_deleted_last_changed;
CREATE INDEX idx_events_athletes_deleted_last_changed ON public.events_athletes(deleted_at, last_changed);

-- Create foreign key indexes for join performance
DROP INDEX IF EXISTS public.idx_events_athletes_event_id;
CREATE INDEX idx_events_athletes_event_id ON public.events_athletes(event_id);

DROP INDEX IF EXISTS public.idx_events_athletes_athlete_id;
CREATE INDEX idx_events_athletes_athlete_id ON public.events_athletes(athlete_id);

-- Create composite indexes for common query patterns
DROP INDEX IF EXISTS public.idx_events_athletes_event_deleted;
CREATE INDEX idx_events_athletes_event_deleted ON public.events_athletes(event_id, deleted_at);

DROP INDEX IF EXISTS public.idx_events_athletes_athlete_deleted;
CREATE INDEX idx_events_athletes_athlete_deleted ON public.events_athletes(athlete_id, deleted_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.events_athletes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (assuming similar pattern to other tables)
-- Policy for coaches to manage their own events_athletes relationships
DROP POLICY IF EXISTS "Coaches can manage their events_athletes" ON public.events_athletes;
CREATE POLICY "Coaches can manage their events_athletes" ON public.events_athletes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.event e 
            WHERE e.id = events_athletes.event_id 
            AND e.coach_id = auth.uid()
        )
    );

-- Policy for coaches to view their events_athletes relationships
DROP POLICY IF EXISTS "Coaches can view their events_athletes" ON public.events_athletes;
CREATE POLICY "Coaches can view their events_athletes" ON public.events_athletes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.event e 
            WHERE e.id = events_athletes.event_id 
            AND e.coach_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.events_athletes TO authenticated;
GRANT ALL ON public.events_athletes TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.events_athletes IS 'Junction table linking events to athletes in a many-to-many relationship';
COMMENT ON COLUMN public.events_athletes.event_id IS 'Foreign key to the event table';
COMMENT ON COLUMN public.events_athletes.athlete_id IS 'Foreign key to the athlete table';
COMMENT ON COLUMN public.events_athletes.deleted_at IS 'Timestamp for soft deletion';
COMMENT ON COLUMN public.events_athletes.last_changed IS 'Timestamp for sync operations'; 