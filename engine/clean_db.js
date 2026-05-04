import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  const { error } = await supabase
    .from('leads')
    .delete()
    .neq('name', '___NON_EXISTENT___');

  if (error) {
    console.error(error);
  } else {
    console.log('✅ DB leads table cleaned.');
  }
}

clean();
