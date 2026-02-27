-- Add STATUS column to RSVPs table
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Update existing records to 'approved' so we don't break old RSVPs
UPDATE public.rsvps SET status = 'approved' WHERE status IS NULL;
