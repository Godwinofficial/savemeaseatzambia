-- Add user_id column to weddings, birthday_events, and bridal_showers tables
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.birthday_events ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.bridal_showers ADD COLUMN IF NOT EXISTS user_id uuid;
