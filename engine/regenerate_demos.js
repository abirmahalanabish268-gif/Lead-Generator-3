import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { loadTemplate, validateTemplate, sanitizeData, generateSlug, injectData } from './demoGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_OUT_DIR = path.resolve(__dirname, '..', 'public', 'demo');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function regenerate() {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'EVALUATED');

  if (error) {
    console.error(error);
    return;
  }

  const template = loadTemplate();
  validateTemplate(template);

  console.log(`🎨 Regenerating demos for ${leads.length} leads...`);

  for (const lead of leads) {
    console.log(`  Generating for: ${lead.name}`);
    const cleanData = sanitizeData({
      ...lead,
      ...lead.llm_structured_data
    });
    
    const colors = { primary_color: '#3d0101', accent_color: '#f2e8cf', ...lead.llm_structured_data?.colors }; 
    // Fallback to defaults if missing
    
    const injectionData = {
      ...cleanData,
      primary_color: cleanData.primary_color || '#3d0101',
      accent_color: cleanData.accent_color || '#f2e8cf'
    };

    const html = injectData(template, injectionData);
    const slug = generateSlug(lead.name);
    const filename = `${slug}.html`;
    const filepath = path.join(DEMO_OUT_DIR, filename);

    fs.writeFileSync(filepath, html);
    console.log(`  ✅ Generated: ${filename}`);
  }
}

regenerate();
