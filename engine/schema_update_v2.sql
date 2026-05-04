-- 1. Update status enum constraint
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
ADD CONSTRAINT leads_status_check CHECK (status IN (
  'INGESTED',
  'PROCESSING',
  'EVALUATED',
  'FAILED',
  'PITCHED',
  'REPLIED'
));

-- 2. Add website_quality column
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS website_quality TEXT DEFAULT 'unknown';

-- 3. Add address column if it doesn't exist (needed for improved identity hash)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS address TEXT;

-- 4. Update index to include website_quality for future filtering
DROP INDEX IF EXISTS idx_leads_status_priority;
CREATE INDEX idx_leads_status_priority ON leads(status, priority DESC NULLS LAST);
