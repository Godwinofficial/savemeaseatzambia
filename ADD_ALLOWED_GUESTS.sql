ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS allowed_guests jsonb;
