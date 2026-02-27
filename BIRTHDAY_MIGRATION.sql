-- ===================================================
-- Birthday Events + RSVPs — Supabase Migration
-- Run this in your Supabase SQL Editor
-- ===================================================

-- 1. Birthday Events table
CREATE TABLE IF NOT EXISTS birthday_events (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug         TEXT UNIQUE NOT NULL,
    child_name   TEXT NOT NULL,
    age          TEXT,
    date         DATE,
    time         TEXT,
    venue_name   TEXT,
    venue_address TEXT,
    theme        TEXT,
    dress_code   TEXT,
    cover_image  TEXT,
    hero_image   TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    message      TEXT,
    rsvp_deadline DATE,
    views        INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Birthday RSVPs table
CREATE TABLE IF NOT EXISTS birthday_rsvps (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id   UUID REFERENCES birthday_events(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    attending  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security
ALTER TABLE birthday_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_rsvps  ENABLE ROW LEVEL SECURITY;

-- Allow public READ on birthday_events (so guests can view their invitation)
CREATE POLICY "Public read birthday_events"
    ON birthday_events FOR SELECT
    USING (true);

-- Allow authenticated users (admins) full access to birthday_events
CREATE POLICY "Admins manage birthday_events"
    ON birthday_events FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Allow anyone to INSERT an RSVP (guests submitting the form)
CREATE POLICY "Anyone can RSVP birthday"
    ON birthday_rsvps FOR INSERT
    WITH CHECK (true);

-- Allow public READ on birthday_rsvps (for admin RSVP count)
CREATE POLICY "Public read birthday_rsvps"
    ON birthday_rsvps FOR SELECT
    USING (true);

-- Allow authenticated users to delete RSVPs
CREATE POLICY "Admins delete birthday_rsvps"
    ON birthday_rsvps FOR DELETE
    USING (auth.role() = 'authenticated');

-- 4. Storage bucket policy (if you use the existing 'wedding-uploads' bucket)
-- The birthday photos will go into birthday/ sub-folders automatically.
-- No changes needed if the bucket already allows authenticated uploads.
