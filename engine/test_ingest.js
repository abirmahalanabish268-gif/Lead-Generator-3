import { normalizeLead } from './normalize.js';
import { upsertLead } from './db.js';

const mockScraperOutput = [
  { name: "The Local Roast", category: "Cafe", city: "Kolkata", phone: "+91 98765 43210" },
  { name: "Design Haven", category: "Interior Designer", city: "Kolkata", phone: "+91 91234 56789" }
];

async function runTestIngest() {
  console.log("📥 Simulating raw scraper data ingestion...");
  for (const rawLead of mockScraperOutput) {
    try {
      const normalized = normalizeLead(rawLead);
      console.log(`Normalizing "${rawLead.name}" -> Hash: ${normalized.identity_hash}`);
      await upsertLead(normalized);
      console.log(`✅ Upserted ${normalized.name} safely.`);
    } catch (err) {
      console.error(`❌ Failed to ingest ${rawLead.name}: ${err.message}`);
    }
  }
  console.log("Ingestion simulation complete.");
}

runTestIngest();
