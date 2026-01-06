-- FIX DATE TYPES V3 (Safe & Robust)
-- This script safely handles columns regardless of whether they are ALREADY dates or currently TEXT.
-- It avoids "invalid input syntax" errors by casting to text before checking for empty strings.

-- 1. Main Date
-- Safe check: turn empty strings to NULL (casts to text first to avoid error if already Date)
UPDATE public.weddings SET date = NULL WHERE date::text = '';
ALTER TABLE public.weddings ALTER COLUMN date TYPE date USING date::date;

-- 2. Ceremony Date
UPDATE public.weddings SET ceremony_date = NULL WHERE ceremony_date::text = '';
ALTER TABLE public.weddings ALTER COLUMN ceremony_date TYPE date USING ceremony_date::date;

-- 3. Ceremony Time
UPDATE public.weddings SET ceremony_time = NULL WHERE ceremony_time::text = '';
ALTER TABLE public.weddings ALTER COLUMN ceremony_time TYPE time without time zone USING ceremony_time::time without time zone;

-- 4. Reception Date
UPDATE public.weddings SET reception_date = NULL WHERE reception_date::text = '';
ALTER TABLE public.weddings ALTER COLUMN reception_date TYPE date USING reception_date::date;

-- 5. Reception Time
UPDATE public.weddings SET reception_time = NULL WHERE reception_time::text = '';
ALTER TABLE public.weddings ALTER COLUMN reception_time TYPE time without time zone USING reception_time::time without time zone;

-- 6. RSVP Deadline (Likely already a Date, but this makes it safe to run)
UPDATE public.weddings SET rsvp_deadline = NULL WHERE rsvp_deadline::text = '';
ALTER TABLE public.weddings ALTER COLUMN rsvp_deadline TYPE date USING rsvp_deadline::date;
