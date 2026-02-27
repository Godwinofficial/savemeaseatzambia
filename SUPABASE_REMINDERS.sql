-- Add columns for reminder settings to the weddings table
ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS reminder_day_of_event_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_custom_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_custom_message TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_sent_day_of BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_custom BOOLEAN DEFAULT FALSE;

-- Create an index to quickly find weddings with pending reminders
CREATE INDEX IF NOT EXISTS idx_weddings_reminders 
ON weddings (reminder_day_of_event_enabled, reminder_custom_date, reminder_sent_day_of, reminder_sent_custom);
