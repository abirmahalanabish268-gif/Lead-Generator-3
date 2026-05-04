import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import { normalizeLead } from './normalize.js';
import { upsertLead } from './db.js';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

/**
 * Scrapes Google Maps for business leads using Apify.
 * Supports query expansion to increase result volume.
 * @param {string|string[]} categories single category or array
 * @param {string|string[]} cities single city or array
 * @param {number} targetLimit final target for deduplicated leads
 */
export async function scrapeLeads(categories, cities, targetLimit = 50) {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error("Missing APIFY_API_TOKEN in environment.");
  }

  const categoryList = Array.isArray(categories) ? categories : [categories];
  const cityList = Array.isArray(cities) ? cities : [cities];

  // 1. Query Expansion Logic
  const searchQueries = [];
  for (const city of cityList) {
    for (const cat of categoryList) {
      searchQueries.push(`${cat} in ${city}`);
      
      // Automatic expansion for common niches to increase volume
      if (cat.toLowerCase().includes('salon')) {
        searchQueries.push(`hairdresser in ${city}`, `beauty parlour in ${city}`, `nail salon in ${city}`);
      } else if (cat.toLowerCase().includes('cafe')) {
        searchQueries.push(`coffee shop in ${city}`, `pastry shop in ${city}`, `bistro in ${city}`);
      } else if (cat.toLowerCase().includes('photo')) {
        searchQueries.push(`wedding photographer in ${city}`, `studio photography in ${city}`);
      }
    }
  }

  console.log(`\n🔍 Starting Expanded Scraper run...`);
  console.log(`   Target Limit: ${targetLimit}`);
  console.log(`   Queries (${searchQueries.length}): ${searchQueries.join(' | ')}`);

  const limitPerQuery = Math.ceil(targetLimit / Math.max(1, searchQueries.length));
  
  const runInput = {
    "searchStringsArray": searchQueries,
    "maxCrawledPlacesPerSearch": limitPerQuery, // Distribute load evenly across queries
    "language": "en",
    "scrapeContacts": true,
    // "website": "withoutWebsite" // Removed: Fetch all places so Groq can evaluate website quality
  };

  try {
    const run = await client.actor("compass/crawler-google-places").call(runInput);
    console.log(`✅ Actor finished. Dataset: ${run.defaultDatasetId}`);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`📊 Raw scraper items: ${items.length}`);

    // 1. Deduplicate results from multiple queries BEFORE DB insertion
    const uniqueMap = new Map();
    for (const item of items) {
      try {
        const normalized = normalizeLead({
          name: item.title,
          city: item.city || cityList[0],
          address: item.address,
          phone: item.phone,
          category: item.categoryName || categoryList[0],
          website: item.website
        });
        
        // Map ensures we only keep one entry per unique identity
        if (!uniqueMap.has(normalized.identity_hash)) {
          uniqueMap.set(normalized.identity_hash, normalized);
        }
      } catch (err) {
        // console.warn(`  ⚠️ Skip parse: ${err.message}`);
      }
    }

    const preDedupeCount = items.length;
    const deduplicatedItems = Array.from(uniqueMap.values());
    const queryDuplicates = preDedupeCount - deduplicatedItems.length;

    console.log(`🧹 Pre-insertion deduplication: removed ${queryDuplicates} overlaps from multiple queries.`);

    // 2. Insert into Database safely
    let savedCount = 0;
    let dbDuplicateCount = 0;

    for (const lead of deduplicatedItems) {
      try {
        const data = await upsertLead(lead);
        if (data) savedCount++;
        else dbDuplicateCount++; // Duplicate ignored by DB constraint
      } catch (err) {
        console.error(`  ❌ DB Insert error: ${err.message}`);
      }
    }

    console.log(`✨ Final Pipeline Stats:`);
    console.log(`   - Total Scraped: ${preDedupeCount}`);
    // console.log(`   - Query Overlaps: ${queryDuplicates}`);
    console.log(`   - New Leads Stored: ${savedCount}`);
    console.log(`   - Existing in DB: ${dbDuplicateCount}\n`);

    return savedCount;

  } catch (error) {
    console.error("❌ Scraper Error:", error.message);
    throw error;
  }
}

// CLI Execution
if (process.argv[1] && process.argv[1].endsWith('ingest.js')) {
  const cat = process.argv[2] || 'Salon';
  const loc = process.argv[3] || 'Kolkata';
  const lim = parseInt(process.argv[4]) || 50;
  scrapeLeads(cat, loc, lim).catch(console.error);
}
