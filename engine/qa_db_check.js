import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runQA() {
  console.log('🔍 Starting QA Database Validation...');

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'EVALUATED')
    .limit(100); 

  if (error) {
    console.error('❌ DB Error:', error.message);
    process.exit(1);
  }

  console.log(`📊 Validating most recent ${leads.length} evaluated leads...`);

  let failures = 0;
  const identityHashes = new Set();

  for (const lead of leads) {
    const issues = [];
    
    const llm = lead.llm_structured_data || {};
    
    if (!Array.isArray(llm.services) || llm.services.length !== 3) issues.push('Invalid services array');
    if (!Array.isArray(llm.image_keywords) || llm.image_keywords.length !== 3) issues.push('Invalid image_keywords array');
    if (!llm.tagline) issues.push('Empty tagline');
    if (!llm.description) issues.push('Empty description');
    if (typeof lead.priority !== 'number') issues.push('Missing priority');
    if (typeof lead.should_contact !== 'boolean') issues.push('Missing should_contact');

    if (issues.length > 0) {
      failures++;
      console.log(`❌ Lead ID ${lead.id} (${lead.name}): ${issues.join(', ')}`);
    }
  }

  if (failures === 0) {
    console.log('✅ All DB records passed validation.');
  } else {
    console.log(`⚠️ QA Database Validation failed with ${failures} issues.`);
  }
}

runQA();
