import { scrapeLeads } from './ingest.js';
import { getLeadsByState, getTopLeads, updateLeadState, saveDemoUrl } from './db.js';
import { evaluateLead } from './groq.js';
import { generateDemo } from './demoGenerator.js';

const EVALUATION_BATCH_SIZE = 30;
const TOP_LEADS_COUNT = 10;

export async function runPipeline(categories, city, maxLeads = 30, options = {}) {
  const isDryRun = options.dryRun || false;

  const categoryList = Array.isArray(categories) ? categories : [categories];

  console.log('🌊 STARTING PRODUCTION PIPELINE 🌊');
  if (isDryRun) console.log('🛡️  MODE: DRY RUN (Simulating only, no writes)\n');
  
  console.log(`Categories: ${categoryList.join(', ')} | City: ${city} | Exact: ${maxLeads} leads\n`);

  const stats = {
    scraped:   0,
    evaluated: 0,
    failed:    0,
    demos:     0,
    skipped:   0,
    fallbacks: 0
  };

  // ─────────────────────────────────────────────
  // STEP 1: Scrape & Ingest
  // ─────────────────────────────────────────────
  console.log('--- STEP 1: SCRAPE & INGEST (Apify → Google Maps India) ---');
  try {
    if (isDryRun) {
      console.log('DRY RUN: Skipping real scraper call.');
      stats.scraped = 0;
    } else {
      stats.scraped = await scrapeLeads(categoryList, city, maxLeads);
    }
    console.log(`✅ Step 1 Complete: ${stats.scraped} new leads from Apify.\n`);
  } catch (err) {
    console.error(`❌ Apify scraper failed: ${err.message}`);
    console.error(`⛔ Stopping pipeline. Cannot evaluate without real scraped data.\n`);
    return { success: false, stats, topLeads: [], error: `Scraper failed: ${err.message}` };
  }

  if (!isDryRun && stats.scraped === 0) {
    console.error(`❌ Apify returned 0 new leads. Stopping pipeline — will NOT evaluate stale data.\n`);
    return { success: false, stats, topLeads: [], error: 'No new leads scraped from Apify' };
  }

  // ─────────────────────────────────────────────
  // STEP 2: Groq Evaluation
  // ─────────────────────────────────────────────
  console.log('--- STEP 2: GROQ EVALUATION ---');
  const pendingLeads = await getLeadsByState('INGESTED', EVALUATION_BATCH_SIZE);
  console.log(`Found ${pendingLeads.length} leads pending evaluation.`);

  for (const lead of pendingLeads) {
    console.log(`\n🔬 Evaluating: ${lead.name} | ${lead.category}`);

    if (isDryRun) {
      console.log('DRY RUN: Simulating evaluation...');
      stats.evaluated++;
      continue;
    }

    // Lock lead into PROCESSING
    await updateLeadState(lead.id, 'PROCESSING');

    const result = await evaluateLead(lead);

    if (!result) {
      console.error(`  ❌ Marking as FAILED.`);
      await updateLeadState(lead.id, 'FAILED');
      stats.failed++;
      continue;
    }

    await updateLeadState(lead.id, 'EVALUATED', {
      should_contact:      result.should_contact,
      priority:            result.priority,
      niche:               result.niche,
      message:             result.message,
      tagline:             result.tagline,
      description:         result.description,
      style:               result.style,
      website_quality:     lead.website ? 'unknown' : 'none',
      llm_structured_data: result,
    });

    console.log(`  ✅ Evaluated | Contact: ${result.should_contact} | Priority: ${result.priority}/10`);
    stats.evaluated++;
    await new Promise(r => setTimeout(r, 500));
  }

  // ─────────────────────────────────────────────
  // STEP 3: Select Top Leads
  // ─────────────────────────────────────────────
  console.log('\n--- STEP 3: SELECT TOP LEADS ---');
  const topLeads = await getTopLeads(TOP_LEADS_COUNT);
  console.log(`Selected ${topLeads.length} candidates for outreach.`);

  // ─────────────────────────────────────────────
  // STEP 4: Generate Demo Websites
  // ─────────────────────────────────────────────
  console.log('\n--- STEP 4: GENERATE DEMO WEBSITES ---');

  for (const lead of topLeads) {
    if (lead.demo_url) {
      console.log(`  ⏭️  Skipping "${lead.name}": Demo already exists at ${lead.demo_url}`);
      stats.skipped++;
      continue;
    }

    console.log(`\n🎨 Generating demo for: ${lead.name}`);
    
    if (isDryRun) {
      console.log('DRY RUN: Simulating demo generation...');
      stats.demos++;
      continue;
    }

    try {
      const result = await generateDemo(lead);
      if (result) {
        await saveDemoUrl(lead.id, result.demo_url);
        stats.demos++;
      }
    } catch (err) {
      console.error(`  ❌ Demo generation failed for "${lead.name}": ${err.message}`);
      await updateLeadState(lead.id, 'FAILED');
      stats.failed++;
    }
  }

  console.log(`\n✅ Step 4 Complete. Demos: ${stats.demos} | Skipped: ${stats.skipped} | Failed: ${stats.failed}\n`);
  console.log('✨ PIPELINE RUN COMPLETE ✨');

  return { success: true, stats, topLeads };
}

// ─────────────────────────────────────────────
// CLI Execution
// ─────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith('pipeline.js')) {
  const categories = process.argv[2] ? process.argv[2].split(',') : ['Cafe', 'Salon', 'Photographer'];
  const city       = process.argv[3] || 'India';
  const limit      = parseInt(process.argv[4]) || 30;
  const dryRun     = process.argv.includes('--dry-run');

  runPipeline(categories, city, limit, { dryRun })
    .then(result => {
      console.log('\nFinal Stats Report:', result.stats);
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal Pipeline Error:', err);
      process.exit(1);
    });
}
