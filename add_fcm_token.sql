-- Add FCM Token column to profiles for Push Notifications
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Update View View Pending Approvals if necessary (usually it selects *, so automatic)
-- But checking just in case.
