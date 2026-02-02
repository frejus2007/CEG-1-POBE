-- Add start_date and end_date columns to censor_unlocks table
ALTER TABLE public.censor_unlocks ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.censor_unlocks ADD COLUMN IF NOT EXISTS end_date date;

-- Insert logic to ensure rows exist for standard periods?
-- Or we handle that in the app.
-- For now just schema update.
