-- Add dynamic text columns to birthday_events
ALTER TABLE public.birthday_events 
  ADD COLUMN IF NOT EXISTS hero_greeting text DEFAULT 'Shhhhh!!!',
  ADD COLUMN IF NOT EXISTS welcome_message text DEFAULT 'This is not just a party—it’s a secret waiting to unfold. We can’t wait to celebrate with you.',
  ADD COLUMN IF NOT EXISTS rsvp_message text DEFAULT 'Strictly by invitation and no children allowed.',
  ADD COLUMN IF NOT EXISTS logo_initials text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS extra_card_text text DEFAULT '';
