import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getUrls() {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('demo_url')
    .not('demo_url', 'is', null)
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(leads.map(l => l.demo_url), null, 2));
  }
}

getUrls();
