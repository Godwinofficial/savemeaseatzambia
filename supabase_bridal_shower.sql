-- ============================================================
-- BRIDAL SHOWERS TABLE
-- Run this once in your Supabase SQL Editor
-- ============================================================

create table if not exists bridal_showers (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    slug text unique not null,

    -- Core Details
    bride_name text,
    date date,
    time time,
    rsvp_deadline date,
    dress_code text,

    -- Venue
    venue_name text,
    venue_address text,
    map_location text,  -- Google Maps embed URL

    -- JSON arrays
    registry_items jsonb default '[]'::jsonb,
    gallery_images jsonb default '[]'::jsonb
);

-- ============================================================
-- BRIDAL SHOWER RSVPs TABLE
-- ============================================================

create table if not exists bridal_shower_rsvps (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    event_id uuid references bridal_showers(id) on delete cascade,
    first_name text,
    last_name text,
    email text,
    phone text,
    attending boolean,
    message text,
    status text default 'pending'
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (Optional but recommended)
-- ============================================================

alter table bridal_showers enable row level security;
alter table bridal_shower_rsvps enable row level security;

-- Allow public read of bridal showers
create policy "Public read bridal_showers"
    on bridal_showers for select using (true);

-- Allow public insert into rsvps
create policy "Public insert bridal_shower_rsvps"
    on bridal_shower_rsvps for insert with check (true);

-- Allow authenticated admin to do everything
create policy "Admin full access bridal_showers"
    on bridal_showers for all using (auth.role() = 'authenticated');

create policy "Admin full access bridal_shower_rsvps"
    on bridal_shower_rsvps for all using (auth.role() = 'authenticated');
