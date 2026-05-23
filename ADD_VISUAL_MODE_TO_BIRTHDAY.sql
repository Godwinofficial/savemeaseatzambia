-- Update birthday_events table with missing columns
ALTER TABLE public.birthday_events 
  ADD COLUMN IF NOT EXISTS visual_mode text DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS template_id integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS map_embed text DEFAULT '';
