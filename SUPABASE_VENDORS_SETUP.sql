-- SUPABASE SETUP SCRIPT FOR DYNAMIC VENDORS
-- Run this script in your Supabase SQL Editor to create the vendors table and seed initial entries.

-- 1. Create the vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    category text NOT NULL,
    city text NOT NULL,
    image text,
    rating text DEFAULT '5.0 Verified',
    description text
);

-- 2. Seed initial vendor records
INSERT INTO public.vendors (name, category, city, image, rating, description)
VALUES 
('Glow by Sarah M.', 'Makeup', 'Lusaka', 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=600', '5.0 Verified', 'Top-rated makeup professional. One simple search.'),
('Obelisk Photography', 'Photography', 'Lusaka', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', '5.0 Verified', 'Top-rated photography professional. One simple search.'),
('Amethyst Decor Designs', 'Decor', 'Lusaka', 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80', '5.0 Verified', 'Top-rated decor professional. One simple search.'),
('Lusaka Gourmet Caterers', 'Catering', 'Lusaka', 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80', '5.0 Verified', 'Top-rated catering professional. One simple search.'),
('The Savannah Pavilions', 'Venues', 'Lusaka', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80', '5.0 Verified', 'Top-rated venues professional. One simple search.'),
('Lola Wedding Planners', 'Decor', 'Kitwe', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80', '5.0 Verified', 'Top-rated decor professional. One simple search.'),
('Zambia Sound & Stage Lights', 'Venues', 'Lusaka', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', '5.0 Verified', 'Top-rated venues professional. One simple search.')
ON CONFLICT DO NOTHING;
