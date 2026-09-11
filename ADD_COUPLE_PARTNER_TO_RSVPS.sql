-- Add partner/couple columns to rsvps table safely
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS partner_name TEXT DEFAULT NULL;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS partner_phone TEXT DEFAULT NULL;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS partner_email TEXT DEFAULT NULL;

COMMENT ON COLUMN public.rsvps.partner_name IS 'Name of partner or plus one for couple invitations';
COMMENT ON COLUMN public.rsvps.partner_phone IS 'Phone number of partner or plus one';
COMMENT ON COLUMN public.rsvps.partner_email IS 'Email of partner or plus one';
