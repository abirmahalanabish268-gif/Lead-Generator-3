import 'dotenv/config';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_TIMEOUT_MS = 15000; // 15 second timeout per call

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 - INTELLIGENCE & PERSONALIZATION LAYER
// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL ARCHITECTURE RULE (NON-NEGOTIABLE):
// 1. This layer is the SOLE location for AI-driven decision making.
// 2. All personalization (services, keywords, branding) MUST happen here.
// 3. Output must be strictly validated before passing to the rendering engine.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * STEP 1: Input Sanitizer
 * Validates and normalizes lead data before sending to Groq.
 * Groq must NEVER receive raw, uncleaned data.
 * @returns {object} sanitized input payload, or null if record is invalid
 */
export function buildGroqInput(lead) {
  if (!lead || !lead.name || !lead.category) {
    return null;
  }

  return {
    name:         (lead.name || '').trim(),
    category:     (lead.category || '').trim(),
    city:         (lead.city || 'unknown').trim(),
    has_website:  Boolean(lead.website && lead.website.trim().length > 0),
    rating:       Math.max(0, parseFloat(lead.rating) || 0),
    review_count: Math.max(0, parseInt(lead.review_count) || 0),
    address:      (lead.address || '').trim(),
    phone:        (lead.phone || '').trim(),
  };
}

/**
 * STEP 2: Output Schema Validator
 * Validates and clamps the Groq response to expected types and ranges.
 * @returns {object|null} validated output or null if unrecoverable
 */
function validateGroqOutput(parsed) {
  if (typeof parsed !== 'object' || parsed === null) return null;

  // Validate required fields exist
  if (typeof parsed.should_contact !== 'boolean') return null;
  if (typeof parsed.message !== 'string' || parsed.message.length === 0) return null;
  if (typeof parsed.niche !== 'string' || parsed.niche.length === 0) return null;

  // Clamp priority to 1–10 integer
  let priority = parseInt(parsed.priority);
  if (isNaN(priority)) return null;
  priority = Math.min(10, Math.max(1, priority));

  return {
    should_contact: parsed.should_contact,
    priority,
    niche:          (parsed.niche || 'general').trim(),
    message:        (parsed.message || '').slice(0, 400).trim(),
    tagline:        (parsed.tagline || '').slice(0, 200).trim(),
    description:    (parsed.description || '').slice(0, 500).trim(),
    style:          (parsed.style || 'modern').trim(),
    services:       Array.isArray(parsed.services) ? parsed.services.slice(0, 3) : ['Premium Quality', 'Expert Team', 'Customer Focus'],
    service_descriptions: Array.isArray(parsed.service_descriptions) ? parsed.service_descriptions.slice(0, 3) : [
      "Professional service tailored to your business needs.",
      "Experienced team delivering reliable results every time.",
      "Focused on quality and customer satisfaction."
    ],
    image_keywords: Array.isArray(parsed.image_keywords) ? parsed.image_keywords.slice(0, 3) : ['interior', 'detail', 'product'],
  };
}

/**
 * STEP 3: Groq API Caller (with timeout + retry)
 */
async function callGroqAPI(input) {
  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ API key.');
  }

  const systemPrompt = `You are a senior business development analyst for a web design agency targeting small businesses in India that have NO website.

YOUR MISSION: Analyze each business lead, classify what type of business it is, and decide if it's a promising outreach target for selling a professional website (₹5,000, delivered in 2 days).

CRITICAL CONTEXT: The scraper ONLY returns businesses WITHOUT a website. Every lead has no online presence.

STEP 1 — CLASSIFY THE BUSINESS
Look at the business name, category hint (if any), city, and address. Determine:
- What kind of business is this? (be specific: "specialty coffee shop", "bridal makeup salon", "wedding photography studio")
- How much does this business depend on online discovery for revenue?
- Is this a service business, retail, professional, or other?

STEP 2 — EVALUATE OUTREACH POTENTIAL using these 5 signals:

1. ONLINE PRESENCE GAP (most important)
   - No website = invisible on Google. This is the #1 pain point.
   - Popular businesses (high reviews) with no website are GOLDEN — they're clearly successful offline but missing digital reach.

2. WEBSITE IMPACT ON REVENUE
   - HIGH IMPACT: Cafes, restaurants, salons, photographers, boutiques, bakeries, gyms, spas, clinics, coaching centers — customers search online before visiting.
   - MEDIUM IMPACT: Retail shops, hardware stores, repair shops — some online search but walk-ins matter more.
   - LOW IMPACT: Industrial suppliers, wholesalers, B2B services — they operate differently.
   Only pursue HIGH and MEDIUM impact businesses.

3. ESTABLISHMENT QUALITY
   - 50+ reviews: Established, likely has budget for a website. HIGH value.
   - 10-50 reviews: Growing business, good potential.
   - <10 reviews: May be new or small — lower priority but could need a website more urgently.

4. CITY CONTEXT
   - Major cities (Mumbai, Delhi, Bangalore, etc.): Fierce competition, a website is survival. HIGH urgency.
   - Tier-2 cities (Pune, Jaipur, Indore, etc.): Growing market, competitors are getting online. MEDIUM-HIGH urgency.
   - Smaller cities: Less competition online but growing fast. MEDIUM urgency.

5. BUSINESS SIZE SIGNAL
   - Phone number listed → more reachable and established.
   - Address with area details → real physical business.
   - Category from Google Maps → helps classify the business.

PRIORITY SCORING:
- 9-10: Popular business (50+ reviews) + high-website-impact category + major city → HOT lead
- 7-8: Growing business (10-50 reviews) + high-impact category → Strong lead
- 5-6: Small business + high-impact OR popular + medium-impact → Decent lead
- 3-4: Small + medium-impact OR sparse data → Weak lead
- 1-2: Low-impact category or insufficient data → Skip

SHOULD_CONTACT RULE:
- true: priority >= 5
- false: priority < 5

MESSAGE RULES:
- Reference their business type specifically (e.g., "your salon" not "your business").
- Explain why THEIR type of business needs a website (e.g., "customers search 'best cafe near me'" for a cafe).
- Mention they have great reviews — this means they're losing online customers.
- Keep it under 60 words. Conversational, not salesy.
- Never say "your business" — always name the type (salon, cafe, studio, clinic, etc.).

STYLE RULES — pick a visual style that matches the business personality:
- modern: tech, coaching, fitness, dental
- cozy: cafe, bakery, spa, salon
- premium: boutique, photography, interior design
- vibrant: restaurant, gym, entertainment
- classic: law firm, clinic, traditional shop
- minimal: studio, agency, freelancer

Required output schema (return ONLY this JSON):
{
  "should_contact": boolean,
  "priority": integer (1-10),
  "niche": string (specific sub-category you classified, e.g. "specialty coffee" or "bridal salon"),
  "message": string (max 60 words, personalized outreach mentioning their business type),
  "tagline": string (short catchy phrase for their business, max 10 words),
  "description": string (2-sentence brand description for their business),
  "style": string (one of: modern, classic, cozy, premium, vibrant, minimal),
  "services": ["string", "string", "string"],
  "service_descriptions": ["string", "string", "string"],
  "image_keywords": ["string", "string", "string"]
}`;

  const userPrompt = `Evaluate this Indian business (NO website — confirmed by Apify scraper):
Name: ${input.name}
Category: ${input.category}
City: ${input.city}, India
Address: ${input.address || 'Not available'}
Phone: ${input.phone || 'Not available'}
Rating: ${input.rating}/5
Reviews: ${input.review_count}
Has Website: false

Is this ${input.category} a good lead for selling a ₹5,000 professional website?`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Slightly higher for message variety, still deterministic
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const err = new Error(`Groq API Error: ${response.status} ${errorBody}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    let raw = data.choices[0].message.content;
    // Strip markdown formatting if the LLM wraps the JSON
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(raw);

  } finally {
    clearTimeout(timer);
  }
}

/**
 * MAIN EXPORT: evaluateLead
 * Full pipeline: sanitize input → call Groq (with exponential backoff) → validate output
 */
export async function evaluateLead(lead) {
  const input = buildGroqInput(lead);
  if (!input) {
    console.warn(`  ⚠️ Skipping lead "${lead?.name}": invalid input fields.`);
    return null;
  }

  const MAX_RETRIES = 3;
  let parsed = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callGroqAPI(input);
      parsed = validateGroqOutput(raw);
      if (!parsed) {
        throw new Error('Schema validation failed.');
      }
      return parsed; // Success
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn(`  ⏱️ Groq timeout for "${lead.name}" (Attempt ${attempt}/${MAX_RETRIES}).`);
      } else if (err.status === 429) {
        // Exponential backoff: 3s, 9s, 27s
        const backoffTime = Math.pow(3, attempt) * 1000;
        console.warn(`  🚦 Rate limit hit for "${lead.name}". Waiting ${backoffTime/1000}s before retry...`);
        await new Promise(r => setTimeout(r, backoffTime));
        continue;
      } else {
        console.warn(`  ⚠️ Groq parsing/API error for "${lead.name}": ${err.message}`);
      }

      // If it's the last attempt or not a 429 rate limit, break and fail
      if (attempt === MAX_RETRIES) {
        console.error(`  ❌ Groq permanently failed for "${lead.name}" after ${MAX_RETRIES} attempts.`);
        return null;
      }
    }
  }

  return null;
}
