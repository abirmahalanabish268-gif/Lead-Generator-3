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
    return null; // Skip invalid records
  }

  return {
    name:         (lead.name || '').trim().toLowerCase(),
    category:     (lead.category || 'general').trim().toLowerCase(),
    city:         (lead.city || 'unknown').trim().toLowerCase(),
    has_website:  Boolean(lead.website && lead.website.trim().length > 0),
    rating:       Math.max(0, parseFloat(lead.rating) || 0),
    review_count: Math.max(0, parseInt(lead.review_count) || 0),
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

  const systemPrompt = `You are a business evaluation engine for a web agency's automated outreach pipeline.
Evaluate each business lead and return ONLY valid JSON with no markdown, no code blocks, no extra text.

TARGETING RULES:
- has_website = false → priority 8–10 (critical target, no online presence)
- has_website = true + rating > 4.0 + review_count > 50 → priority 5–7 (improvement opportunity)
- has_website = true, low reviews → priority 1–4 (low priority)

SCORING RULES:
- Use the FULL 1–10 scale. Do NOT cluster all scores at 8.
- Assign meaningfully based on business potential.

MESSAGE RULES:
- If no website: highlight the missing online presence opportunity.
- If website exists: highlight the improvement/redesign opportunity.
- Max 60 words. Sound like a real human BD rep.

Required output schema (return ONLY this JSON):
{
  "should_contact": boolean,
  "priority": integer (1-10),
  "niche": string,
  "message": string (max 60 words),
  "tagline": string (short catchy phrase for their business, max 10 words),
  "description": string (2-sentence brand description for their business),
  "style": string (one of: modern, classic, cozy, premium, vibrant, minimal),
  "services": ["string", "string", "string"], // EXACTLY 3 short, business-specific service titles
  "service_descriptions": ["string", "string", "string"], // EXACTLY 3 short sentences (8-12 words) matching titles
  "image_keywords": ["string", "string", "string"] // EXACTLY 3 single-word keywords
}`;

  const userPrompt = `Lead:
Name: ${input.name}
Category: ${input.category}
City: ${input.city}
Has Website: ${input.has_website}
Rating: ${input.rating}
Review Count: ${input.review_count}`;

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
