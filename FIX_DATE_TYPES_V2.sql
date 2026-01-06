-- FIX DATE TYPES ROBUST VERSION
-- The previous error (22007) happened because you have empty strings ("") in your text columns.
-- Postgres cannot cast "" to a DATE. We must convert "" to NULL first.

-- 1. Main Date
UPDATE public.weddings SET date = NULL WHERE date = '';
ALTER TABLE public.weddings ALTER COLUMN date TYPE date USING date::date;

-- 2. Ceremony Date
UPDATE public.weddings SET ceremony_date = NULL WHERE ceremony_date = '';
ALTER TABLE public.weddings ALTER COLUMN ceremony_date TYPE date USING ceremony_date::date;

-- 3. Ceremony Time
UPDATE public.weddings SET ceremony_time = NULL WHERE ceremony_time = '';
ALTER TABLE public.weddings ALTER COLUMN ceremony_time TYPE time without time zone USING ceremony_time::time without time zone;

-- 4. Reception Date
UPDATE public.weddings SET reception_date = NULL WHERE reception_date = '';
ALTER TABLE public.weddings ALTER COLUMN reception_date TYPE date USING reception_date::date;

-- 5. Reception Time
UPDATE public.weddings SET reception_time = NULL WHERE reception_time = '';
ALTER TABLE public.weddings ALTER COLUMN reception_time TYPE time without time zone USING reception_time::time without time zone;

-- 6. RSVP Deadline
UPDATE public.weddings SET rsvp_deadline = NULL WHERE rsvp_deadline = '';
ALTER TABLE public.weddings ALTER COLUMN rsvp_deadline TYPE date USING rsvp_deadline::date;
