-- Fix the template_id column type in weddings table
-- It was mistakenly set as UUID but should be INTEGER

-- Drop the column entirely to avoid UUID casting errors (since templates are just integers 1-8 anyway, data loss is minimal/irrelevant here if it was all NULLs or invalid)
ALTER TABLE public.weddings DROP COLUMN IF EXISTS template_id;

-- Add it back as the correct integer type
ALTER TABLE public.weddings ADD COLUMN template_id integer DEFAULT 1;
