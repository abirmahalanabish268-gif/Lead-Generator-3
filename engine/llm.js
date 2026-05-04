import 'dotenv/config';

// If run via `node --env-file=.env`, process.env is populated.
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("WARNING: Missing Groq API key in process.env. Ensure you run this script with --env-file=.env");
}

/**
 * Transforms normalized lead data into structured template mappings and outreach copy.
 * Enforces strict JSON output for pipeline determinism.
 */
export async function transformLeadData(normalizedLead) {
  const systemPrompt = `
You are a data evaluation engine for an automated outreach pipeline.
Your job is to generate highly structured, deterministic JSON output.
You must output ONLY raw JSON without markdown code blocks.
Do not include any pleasantries or creative variations.
Evaluate the business to decide if they need a website upgrade.

Schema required:
{
  "should_contact": boolean,
  "priority": number (1-10),
  "niche": "string",
  "message": "string (the actual outreach message, max 60 words)"
}
`;

  const userPrompt = `
Lead Data:
Name: ${normalizedLead.name}
Category: ${normalizedLead.category}
City: ${normalizedLead.city}
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Low temperature for deterministic behavior
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API Error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  try {
    let content = data.choices[0].message.content;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse Groq response as JSON: ${err.message}`);
  }
}
