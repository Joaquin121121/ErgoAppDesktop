-- Enable UUID generation (already exists in the database)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tables with integer primary keys to convert:
-- base_result, basic_result, bosco_result, drop_jump_result, event, jump_time,
-- multiple_drop_jump_result, multiple_jumps_result

-- Add UUID columns to tables with integer primary keys
ALTER TABLE public.base_result ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.basic_result ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.bosco_result ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.drop_jump_result ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.event ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.jump_time ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.multiple_drop_jump_result ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.multiple_jumps_result ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();

-- Populate UUID columns
UPDATE public.base_result SET id_uuid = gen_random_uuid();
UPDATE public.basic_result SET id_uuid = gen_random_uuid();
UPDATE public.bosco_result SET id_uuid = gen_random_uuid();
UPDATE public.drop_jump_result SET id_uuid = gen_random_uuid();
UPDATE public.event SET id_uuid = gen_random_uuid();
UPDATE public.jump_time SET id_uuid = gen_random_uuid();
UPDATE public.multiple_drop_jump_result SET id_uuid = gen_random_uuid();
UPDATE public.multiple_jumps_result SET id_uuid = gen_random_uuid();

-- Step 1: Update foreign key references in basic_result
ALTER TABLE public.basic_result ADD COLUMN base_result_id_uuid UUID;
ALTER TABLE public.basic_result ADD COLUMN bosco_result_id_uuid UUID;

UPDATE public.basic_result AS br
SET base_result_id_uuid = br_base.id_uuid
FROM public.base_result AS br_base
WHERE br.base_result_id = br_base.id;

UPDATE public.basic_result AS br
SET bosco_result_id_uuid = bosco.id_uuid
FROM public.bosco_result AS bosco
WHERE br.bosco_result_id = bosco.id;

-- Step 2: Update foreign key references in drop_jump_result
ALTER TABLE public.drop_jump_result ADD COLUMN base_result_id_uuid UUID;

UPDATE public.drop_jump_result AS djr
SET base_result_id_uuid = br.id_uuid
FROM public.base_result AS br
WHERE djr.base_result_id = br.id;

-- Step 3: Update foreign key references in jump_time
ALTER TABLE public.jump_time ADD COLUMN base_result_id_uuid UUID;

UPDATE public.jump_time AS jt
SET base_result_id_uuid = br.id_uuid
FROM public.base_result AS br
WHERE jt.base_result_id = br.id;

-- Step 4: Update foreign key references in multiple_jumps_result
ALTER TABLE public.multiple_jumps_result ADD COLUMN base_result_id_uuid UUID;

UPDATE public.multiple_jumps_result AS mjr
SET base_result_id_uuid = br.id_uuid
FROM public.base_result AS br
WHERE mjr.base_result_id = br.id;

-- Step 5: Drop foreign key constraints
ALTER TABLE public.basic_result DROP CONSTRAINT IF EXISTS basic_result_base_result_id_fkey;
ALTER TABLE public.basic_result DROP CONSTRAINT IF EXISTS basic_result_bosco_result_id_fkey;
ALTER TABLE public.drop_jump_result DROP CONSTRAINT IF EXISTS drop_jump_result_base_result_id_fkey;
ALTER TABLE public.jump_time DROP CONSTRAINT IF EXISTS jump_time_base_result_id_fkey;
ALTER TABLE public.multiple_jumps_result DROP CONSTRAINT IF EXISTS multiple_jumps_result_base_result_id_fkey;

-- Step 6: Drop primary key constraints
ALTER TABLE public.base_result DROP CONSTRAINT IF EXISTS base_result_pkey;
ALTER TABLE public.basic_result DROP CONSTRAINT IF EXISTS basic_result_pkey;
ALTER TABLE public.bosco_result DROP CONSTRAINT IF EXISTS bosco_result_pkey;
ALTER TABLE public.drop_jump_result DROP CONSTRAINT IF EXISTS drop_jump_result_pkey;
ALTER TABLE public.event DROP CONSTRAINT IF EXISTS event_pkey;
ALTER TABLE public.jump_time DROP CONSTRAINT IF EXISTS jumpTime_pkey;
ALTER TABLE public.multiple_drop_jump_result DROP CONSTRAINT IF EXISTS multiple_drop_jump_result_pkey;
ALTER TABLE public.multiple_jumps_result DROP CONSTRAINT IF EXISTS multiple_jumps_result_pkey;

-- Step 7: Drop old ID columns and foreign key columns
ALTER TABLE public.basic_result DROP COLUMN base_result_id;
ALTER TABLE public.basic_result DROP COLUMN bosco_result_id;
ALTER TABLE public.drop_jump_result DROP COLUMN base_result_id;
ALTER TABLE public.jump_time DROP COLUMN base_result_id;
ALTER TABLE public.multiple_jumps_result DROP COLUMN base_result_id;

ALTER TABLE public.base_result DROP COLUMN id;
ALTER TABLE public.basic_result DROP COLUMN id;
ALTER TABLE public.bosco_result DROP COLUMN id;
ALTER TABLE public.drop_jump_result DROP COLUMN id;
ALTER TABLE public.event DROP COLUMN id;
ALTER TABLE public.jump_time DROP COLUMN id;
ALTER TABLE public.multiple_drop_jump_result DROP COLUMN id;
ALTER TABLE public.multiple_jumps_result DROP COLUMN id;

-- Step 8: Rename UUID columns
ALTER TABLE public.base_result RENAME COLUMN id_uuid TO id;
ALTER TABLE public.basic_result RENAME COLUMN id_uuid TO id;
ALTER TABLE public.bosco_result RENAME COLUMN id_uuid TO id;
ALTER TABLE public.drop_jump_result RENAME COLUMN id_uuid TO id;
ALTER TABLE public.event RENAME COLUMN id_uuid TO id;
ALTER TABLE public.jump_time RENAME COLUMN id_uuid TO id;
ALTER TABLE public.multiple_drop_jump_result RENAME COLUMN id_uuid TO id;
ALTER TABLE public.multiple_jumps_result RENAME COLUMN id_uuid TO id;

ALTER TABLE public.basic_result RENAME COLUMN base_result_id_uuid TO base_result_id;
ALTER TABLE public.basic_result RENAME COLUMN bosco_result_id_uuid TO bosco_result_id;
ALTER TABLE public.drop_jump_result RENAME COLUMN base_result_id_uuid TO base_result_id;
ALTER TABLE public.jump_time RENAME COLUMN base_result_id_uuid TO base_result_id;
ALTER TABLE public.multiple_jumps_result RENAME COLUMN base_result_id_uuid TO base_result_id;

-- Step 9: Recreate primary key constraints
ALTER TABLE public.base_result ADD PRIMARY KEY (id);
ALTER TABLE public.basic_result ADD PRIMARY KEY (id);
ALTER TABLE public.bosco_result ADD PRIMARY KEY (id);
ALTER TABLE public.drop_jump_result ADD PRIMARY KEY (id);
ALTER TABLE public.event ADD PRIMARY KEY (id);
ALTER TABLE public.jump_time ADD PRIMARY KEY (id);
ALTER TABLE public.multiple_drop_jump_result ADD PRIMARY KEY (id);
ALTER TABLE public.multiple_jumps_result ADD PRIMARY KEY (id);

-- Step 10: Recreate foreign key constraints
ALTER TABLE public.basic_result
ADD CONSTRAINT basic_result_base_result_id_fkey 
FOREIGN KEY (base_result_id) REFERENCES public.base_result(id);

ALTER TABLE public.basic_result
ADD CONSTRAINT basic_result_bosco_result_id_fkey 
FOREIGN KEY (bosco_result_id) REFERENCES public.bosco_result(id);

ALTER TABLE public.drop_jump_result
ADD CONSTRAINT drop_jump_result_base_result_id_fkey 
FOREIGN KEY (base_result_id) REFERENCES public.base_result(id);

ALTER TABLE public.jump_time
ADD CONSTRAINT jump_time_base_result_id_fkey 
FOREIGN KEY (base_result_id) REFERENCES public.base_result(id);

ALTER TABLE public.multiple_jumps_result
ADD CONSTRAINT multiple_jumps_result_base_result_id_fkey 
FOREIGN KEY (base_result_id) REFERENCES public.base_result(id);

-- Step 11: Modify sequences and identity columns
ALTER TABLE public.base_result ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.basic_result ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.bosco_result ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.drop_jump_result ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.event ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.jump_time ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.multiple_drop_jump_result ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.multiple_jumps_result ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 12: Drop the sequences that were being used for the ID generation
DROP SEQUENCE IF EXISTS public.base_result_id_seq;
DROP SEQUENCE IF EXISTS public.basic_result_id_seq;
DROP SEQUENCE IF EXISTS public.bosco_result_id_seq;
DROP SEQUENCE IF EXISTS public.drop_jump_result_id_seq;
DROP SEQUENCE IF EXISTS public.event_id_seq;
DROP SEQUENCE IF EXISTS public.jumpTime_id_seq;
DROP SEQUENCE IF EXISTS public.multiple_drop_jump_result_id_seq;
DROP SEQUENCE IF EXISTS public.multiple_jumps_result_id_seq; 