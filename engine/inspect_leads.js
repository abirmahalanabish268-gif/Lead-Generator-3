import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'EVALUATED')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  for (const lead of leads) {
    console.log(`Lead: ${lead.name}`);
    console.log(`LLM Data:`, JSON.stringify(lead.llm_structured_data, null, 2));
    console.log('---');
  }
}

inspect();
