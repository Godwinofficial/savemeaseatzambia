-- FIX DATE AND TIME COLUMN TYPES
-- This script ensures that all date and time columns are using the correct Postgres data types
-- instead of 'text'. This ensures strict validation and better sorting/filtering.

-- 1. Convert 'date' (Main Wedding Date) to DATE
-- We use the USING clause to convert existing text data to date.
-- If some data is invalid text, this might fail, but since the form uses input type="date", it should be strictly YYYY-MM-DD.
ALTER TABLE public.weddings 
ALTER COLUMN date TYPE date USING date::date;

-- 2. Convert 'ceremony_date' to DATE
ALTER TABLE public.weddings 
ALTER COLUMN ceremony_date TYPE date USING ceremony_date::date;

-- 3. Convert 'ceremony_time' to TIME
-- '24:00' or similar might need care, but standard HTML input time outputs HH:MM which casts fine.
ALTER TABLE public.weddings 
ALTER COLUMN ceremony_time TYPE time without time zone USING ceremony_time::time without time zone;

-- 4. Convert 'reception_date' to DATE
ALTER TABLE public.weddings 
ALTER COLUMN reception_date TYPE date USING reception_date::date;

-- 5. Convert 'reception_time' to TIME
ALTER TABLE public.weddings 
ALTER COLUMN reception_time TYPE time without time zone USING reception_time::time without time zone;

-- 6. Ensure rsvp_deadline is DATE (redundant if you ran previous script, but safe)
ALTER TABLE public.weddings 
ALTER COLUMN rsvp_deadline TYPE date USING rsvp_deadline::date;
