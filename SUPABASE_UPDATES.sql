-- Add views column if it doesn't exist
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_views(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.weddings
  SET views = views + 1
  WHERE id = row_id;
END;
$$;
