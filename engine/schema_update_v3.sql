-- Add demo_url column to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS demo_url TEXT;
