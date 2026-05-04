import { getLeadsByState, updateLeadState } from './db.js';
import { transformLeadData } from './llm.js';
import { generateDemoAsset } from './assets.js';

const BATCH_SIZE = 5; // Max N leads per run for safety and determinism

export async function runPipeline() {
  console.log("🚀 Starting Lead Generation Pipeline Engine...");

  // Fetch a batch of unprocessed leads
  const newLeads = await getLeadsByState('INGESTED', BATCH_SIZE);
  console.log(`Found ${newLeads.length} new leads in INGESTED state.`);

  for (const lead of newLeads) {
    console.log(`\nProcessing Lead: ${lead.name} (${lead.identity_hash})`);
    
    try {
      // Step 1: LLM Transformation
      console.log(`  -> [1/2] Transforming via LLM...`);
      const llmData = await transformLeadData(lead);
      
      // Persist LLM transformation state safely before generating assets
      await updateLeadState(lead.id, 'TRANSFORMED_LLM', {
        llm_structured_data: llmData
      });

      // Step 2: Asset Generation
      console.log(`  -> [2/2] Generating Demo Asset...`);
      const assetPayload = await generateDemoAsset(lead.id, llmData);

      // Persist Final state ready for outreach
      await updateLeadState(lead.id, 'READY_FOR_OUTREACH', {
        demo_url: assetPayload.demo_url,
        message: llmData.outreach_message
      });

      console.log(`  ✅ Lead ${lead.name} successfully reached READY_FOR_OUTREACH.`);

    } catch (err) {
      console.error(`  ❌ Failed to process lead ${lead.name}. Halting this record.`);
      console.error(`     Reason: ${err.message}`);
      
      // Mark as FAILED or leave it for manual review. We mark as FAILED to prevent infinite retry loops.
      await updateLeadState(lead.id, 'FAILED');
    }
  }

  console.log("\n🏁 Pipeline run complete.");
}

// Allow execution via Node CLI directly
if (process.argv[1] && process.argv[1].endsWith('job.js')) {
  runPipeline().catch(console.error);
}
