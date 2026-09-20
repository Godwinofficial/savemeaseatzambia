-- ============================================================
-- GUEST-BASED PRICING & EDIT FLOW MIGRATION
-- Run this in your Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add pricing and guest count columns to weddings table
ALTER TABLE public.weddings
    ADD COLUMN IF NOT EXISTS event_id TEXT,
    ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 550,
    ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'Up to 100 guests',
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_due NUMERIC DEFAULT 550;

-- 2. Create index on event_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_weddings_event_id ON public.weddings(event_id);

-- 3. Automatic backend pricing calculator trigger function
-- Calculates price & tier strictly based on guest_count.
-- Also calculates balance_due = GREATEST(0, price - amount_paid).
CREATE OR REPLACE FUNCTION public.calculate_wedding_pricing()
RETURNS TRIGGER AS $$
DECLARE
    g_count INTEGER;
    calculated_price NUMERIC;
    calculated_tier TEXT;
    paid NUMERIC;
BEGIN
    -- Fallback default if null or <= 0
    g_count := COALESCE(NEW.guest_count, 100);
    IF g_count < 1 THEN
        g_count := 100;
    END IF;
    NEW.guest_count := g_count;

    -- Pricing rules (ZMW):
    -- Up to 100 guests: K550
    -- Up to 250 guests: K650
    -- Up to 400 guests: K750
    -- Over 400 guests: K1,000
    IF g_count <= 100 THEN
        calculated_price := 550;
        calculated_tier := 'Up to 100 guests';
    ELSIF g_count <= 250 THEN
        calculated_price := 650;
        calculated_tier := 'Up to 250 guests';
    ELSIF g_count <= 400 THEN
        calculated_price := 750;
        calculated_tier := 'Up to 400 guests';
    ELSE
        calculated_price := 1000;
        calculated_tier := 'Over 400 guests';
    END IF;

    NEW.price := calculated_price;
    NEW.pricing_tier := calculated_tier;

    paid := COALESCE(NEW.amount_paid, 0);

    -- If existing event was previously active/approved and paid is 0,
    -- treat its previous price as paid so moving tiers calculates the balance increment.
    IF (TG_OP = 'UPDATE' AND OLD.status IN ('active', 'approved') AND paid = 0 AND OLD.price IS NOT NULL) THEN
        paid := OLD.price;
        NEW.amount_paid := paid;
    END IF;

    NEW.balance_due := GREATEST(0, calculated_price - paid);

    -- Ensure event_id is never overwritten with null or empty on update
    IF TG_OP = 'UPDATE' AND (NEW.event_id IS NULL OR NEW.event_id = '') THEN
        NEW.event_id := OLD.event_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to public.weddings
DROP TRIGGER IF EXISTS trigger_calculate_wedding_pricing ON public.weddings;
CREATE TRIGGER trigger_calculate_wedding_pricing
BEFORE INSERT OR UPDATE ON public.weddings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_wedding_pricing();

-- 5. Backfill existing records with missing guest_count / price
UPDATE public.weddings
SET 
    guest_count = COALESCE(guest_count, 100),
    amount_paid = CASE WHEN status IN ('active', 'approved') THEN 550 ELSE 0 END
WHERE price IS NULL OR guest_count IS NULL;

-- 6. Ensure rsvps table has check-in columns and owner update permission
ALTER TABLE public.rsvps
    ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS partner_name TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS partner_phone TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS partner_email TEXT DEFAULT NULL;

-- Allow event owners to update RSVPs (check in guests, approve/reject)
DROP POLICY IF EXISTS "rsvps_owner_update" ON public.rsvps;
CREATE POLICY "rsvps_owner_update"
ON public.rsvps
FOR UPDATE
USING (
    wedding_id IN (
        SELECT id FROM public.weddings WHERE user_id = auth.uid()
    )
);

