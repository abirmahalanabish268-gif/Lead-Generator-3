import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import { normalizeLead } from './normalize.js';
import { upsertLead } from './db.js';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const CATEGORIES = {
  'Cafe':              ['coffee shop', 'tea house', 'bistro'],
  'Restaurant':        ['fine dining', 'family restaurant', 'takeaway restaurant'],
  'Bakery':            ['cake shop', 'pastry shop', 'bread bakery'],
  'Salon':             ['hairdresser', 'beauty parlour', 'nail salon'],
  'Spa':               ['ayurvedic spa', 'massage center', 'wellness spa'],
  'Gym':               ['fitness center', 'crossfit gym', 'health club'],
  'Yoga Studio':       ['yoga class', 'meditation center', 'pilates studio'],
  'Photographer':      ['wedding photographer', 'studio photography', 'portrait studio'],
  'Dentist':           ['dental clinic', 'dental care', 'orthodontist'],
  'Clinic':            ['health clinic', 'medical center', 'polyclinic'],
  'Veterinarian':      ['pet clinic', 'veterinary doctor', 'animal hospital'],
  'Boutique':          ['fashion boutique', 'ethnic wear store', 'designer shop'],
  'Tailor':            ['tailoring shop', 'custom clothing', 'alteration service'],
  'Florist':           ['flower shop', 'florist store', 'gift shop'],
  'Coaching Center':   ['tuition center', 'exam coaching', 'training institute'],
  'Dance Studio':      ['dance class', 'dance academy', 'choreography studio'],
  'Music School':      ['music class', 'music academy', 'instrument lessons'],
  'Car Repair':        ['car service center', 'auto garage', 'mechanic workshop'],
  'Bike Repair':       ['bike service center', 'two wheeler repair', 'motorcycle mechanic'],
  'Interior Designer': ['interior decor', 'home design studio', 'furniture store'],
  'Event Planner':     ['wedding planner', 'event management', 'catering service'],
  'Tattoo Studio':     ['tattoo parlor', 'body art studio', 'piercing shop'],
  'Laundry':           ['dry cleaning', 'laundry service', 'ironing shop'],
  'Optician':          ['eye clinic', 'spectacle shop', 'contact lens store'],
  'Pharmacy':          ['medical store', 'chemist shop', 'drug store'],
  'Groceteria':        ['grocery store', 'supermarket', 'provision store'],
  'Stationery':        ['stationery shop', 'book store', 'office supplies'],
  'Hardware Store':    ['hardware shop', 'building materials', 'tools store'],
  'Electronics Repair':['mobile repair', 'laptop repair', 'electronics service'],
  'Printing Press':    ['print shop', 'business card printing', 'banner printing'],
  'Travel Agency':     ['tour operator', 'travel agent', 'holiday planner'],
  'Real Estate':       ['property dealer', 'real estate agent', 'housing consultant'],
  'Insurance Agent':   ['life insurance', 'health insurance', 'vehicle insurance'],
  'Tax Consultant':    ['CA office', 'tax filing service', 'accounting firm'],
  'Lawyer':            ['law firm', 'legal consultant', 'advocate office'],
  'Architecture':      ['architect firm', 'building design', 'construction consultant'],
  'Courier Service':   ['parcel service', 'delivery agency', 'shipping company'],
  'Pet Grooming':      ['dog grooming', 'pet spa', 'pet boarding'],
  'Painting Service':  ['house painter', 'wall painting', 'interior painting'],
  'Plumber':           ['plumbing service', 'pipe repair', 'sanitary fitting'],
  'Electrician':       ['electrical service', 'wiring contractor', 'electric repair'],
  'AC Repair':         ['AC service center', 'air conditioning repair', 'cooling solution'],
  'Pest Control':      ['pest control service', 'termite treatment', 'sanitization service'],
  'Carpenter':         ['furniture maker', 'woodwork shop', 'carpentry service'],
  'Makeup Artist':     ['bridal makeup', 'makeup studio', 'beauty artist'],
  'Nutritionist':      ['dietitian', 'nutrition clinic', 'weight loss center'],
  'Physiotherapist':   ['physiotherapy clinic', 'rehab center', 'sports therapy'],
  'Preschool':         ['play school', 'nursery school', 'daycare center'],
};

const INDIAN_CITIES_SET = new Set([
  'mumbai', 'delhi', 'new delhi', 'bangalore', 'bengaluru', 'hyderabad',
  'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow',
  'chandigarh', 'goa', 'nagpur', 'indore', 'bhopal', 'kochi', 'cochin',
  'varanasi', 'agra', 'surat', 'vadodara', 'nashik', 'thane',
  'navi mumbai', 'ghaziabad', 'faridabad', 'noida', 'howrah',
  'durgapur', 'asansol', 'ranchi', 'jamshedpur', 'bhubaneswar',
  'visakhapatnam', 'vijayawada', 'mysore', 'mangalore',
  'thiruvananthapuram', 'calicut', 'kozhikode', 'coimbatore',
  'madurai', 'tiruchirappalli', 'salem', 'ludhiana', 'amritsar',
  'jalandhar', 'dehradun', 'haridwar', 'udaipur', 'jodhpur',
  'bikaner', 'kota', 'gwalior', 'jabalpur', 'raipur', 'bhilai',
  'dhanbad', 'durg', 'siliguri', 'guwahati', 'shillong', 'imphal',
  'gangtok', 'panaji',
]);

function isIndianBusiness(item) {
  if ((item.countryCode || '').toLowerCase() === 'in') return true;

  const city = (item.city || '').toLowerCase().trim();
  if (INDIAN_CITIES_SET.has(city)) return true;
  for (const c of INDIAN_CITIES_SET) {
    if (city.startsWith(c) || city.endsWith(c)) return true;
  }

  const phone = (item.phone || '').replace(/[\s\-()]/g, '');
  if (phone.startsWith('+91')) return true;
  if (/^[6-9]\d{9}$/.test(phone) && phone.length === 10) return true;

  const addr = (item.address || '').toLowerCase();
  const pin = addr.match(/\b(\d{6})\b/);
  if (pin) {
    const prefix = parseInt(pin[1].substring(0, 2));
    if (prefix >= 11 && prefix <= 85) return true;
  }

  return false;
}

export function getCategoryNames() {
  return Object.keys(CATEGORIES);
}

export async function scrapeLeads(categories, cities, targetLimit = 30) {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error("Missing APIFY_API_TOKEN in environment.");
  }

  const categoryList = Array.isArray(categories) ? categories : [categories];
  const locationQuery = cities && cities.toLowerCase() !== 'india'
    ? (Array.isArray(cities) ? cities.join(', ') + ', India' : `${cities}, India`)
    : 'India';

  console.log(`\n🔍 Starting Scraper run (INDIA ONLY)...`);
  console.log(`   Categories: ${categoryList.join(', ')}`);
  console.log(`   Location: ${locationQuery}`);
  console.log(`   Target: ${targetLimit} leads`);

  const allItems = [];

  try {
    const run = await client.actor("compass/crawler-google-places").call({
      "searchStringsArray": categoryList,
      "locationQuery": locationQuery,
      "maxCrawledPlacesPerSearch": targetLimit,
      "language": "en",
      "countryCode": "in",
      "website": "withoutWebsite",
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`     Got ${items.length} results`);
    allItems.push(...items);
  } catch (err) {
    console.error(`     ❌ Scraping failed: ${err.message}`);
  }

  console.log(`\n📊 Total from Apify: ${allItems.length} businesses`);

  if (allItems.length === 0) {
    console.error(`❌ No results from any city.`);
    return 0;
  }

  const indiaOnly = allItems.filter(isIndianBusiness);
  const filteredOut = allItems.length - indiaOnly.length;
  if (filteredOut > 0) {
    console.log(`🇮🇳 Filtered out ${filteredOut} non-Indian. Kept ${indiaOnly.length}.`);
  }

  if (indiaOnly.length === 0) {
    console.error(`❌ No Indian businesses after filtering.`);
    return 0;
  }

  const uniqueMap = new Map();
  for (const item of indiaOnly) {
    try {
      const normalized = normalizeLead({
        name: item.title,
        city: item.city || 'India',
        address: item.address,
        phone: item.phone,
        category: item.categoryName || categoryList[0],
        website: item.website,
        rating: item.totalScore,
        review_count: item.reviewsCount,
      });
      if (!uniqueMap.has(normalized.identity_hash)) {
        uniqueMap.set(normalized.identity_hash, normalized);
      }
    } catch (err) {}
  }

  const allDeduplicated = Array.from(uniqueMap.values());
  console.log(`🧹 After dedup: ${allDeduplicated.length} unique Indian businesses`);

  const cappedLeads = allDeduplicated.slice(0, targetLimit);
  console.log(`✂️  Capping to exactly ${targetLimit} leads (from ${allDeduplicated.length} unique)`);

  let savedCount = 0;
  let dbDuplicateCount = 0;

  for (const lead of cappedLeads) {
    try {
      const data = await upsertLead(lead);
      if (data) savedCount++;
      else dbDuplicateCount++;
    } catch (err) {
      console.error(`  ❌ DB Insert error: ${err.message}`);
    }
  }

  console.log(`✨ Results:`);
  console.log(`   - Raw from Apify: ${allItems.length}`);
  console.log(`   - India Only: ${indiaOnly.length}`);
  console.log(`   - Unique: ${allDeduplicated.length}`);
  console.log(`   - Stored: ${savedCount}`);
  console.log(`   - Duplicates: ${dbDuplicateCount}\n`);

  return savedCount;
}

if (process.argv[1] && process.argv[1].endsWith('ingest.js')) {
  const cat = process.argv[2] || 'Cafe';
  const loc = process.argv[3] || 'India';
  const lim = parseInt(process.argv[4]) || 30;
  scrapeLeads(cat, loc, lim).catch(console.error);
}
