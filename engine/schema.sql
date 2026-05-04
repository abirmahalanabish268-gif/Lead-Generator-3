-- ================================================================
-- Phase 2 Schema Migration
-- Run this in Supabase SQL Editor to upgrade the leads table.
-- ================================================================

-- 1. Ensure identity_hash column exists with UNIQUE constraint
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS identity_hash TEXT UNIQUE;

-- 2. Drop old status constraint so we can replace it
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_name_city_key;

-- 3. Apply new Phase 2 status state machine
ALTER TABLE leads
ADD CONSTRAINT leads_status_check CHECK (status IN (
  'INGESTED',   -- Raw lead stored, pending evaluation
  'EVALUATED',  -- Groq has evaluated the lead
  'FAILED',     -- Groq evaluation failed permanently
  'PITCHED',    -- Outreach message sent (future use)
  'REPLIED'     -- Business replied (future use)
));

-- 4. Ensure LLM structured data column exists
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS llm_structured_data JSONB;

-- 5. Add dedicated evaluated columns for fast querying/sorting
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS should_contact BOOLEAN;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS priority INTEGER CHECK (priority >= 1 AND priority <= 10);

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS niche TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS tagline TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS style TEXT;

-- 6. Add performance index for top lead queries
CREATE INDEX IF NOT EXISTS idx_leads_status_priority
ON leads(status, priority DESC);

-- 7. Migrate any existing records to new status names
UPDATE leads SET status = 'INGESTED' WHERE status IN ('new', 'SCORED');
UPDATE leads SET status = 'EVALUATED' WHERE status = 'TRANSFORMED_LLM';
UPDATE leads SET status = 'PITCHED' WHERE status IN ('messaged', 'replied', 'PITCHED');
