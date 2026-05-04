import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const TEMPLATE_PATH = path.resolve(__dirname, '..', 'templates', 'demo.html');
const DEMO_OUT_DIR = path.resolve(__dirname, '..', 'public', 'demo');

// BASE_URL for constructing public links
const BASE_URL = (process.env.DEMO_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 - DETERMINISTIC RENDERING ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL ARCHITECTURE RULE (NON-NEGOTIABLE):
// 1. Phase 2 (Groq) -> ALL intelligence and decision-making.
// 2. Phase 3 (This File) -> ONLY rendering. NO AI calls. NO branching logic.
// 3. This engine must remain PURELY DETERMINISTIC.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Load Template
 */
export function loadTemplate() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template file not found at ${TEMPLATE_PATH}`);
  }
  return fs.readFileSync(TEMPLATE_PATH, 'utf8');
}

/**
 * 2. Validate Template
 */
export function validateTemplate(template) {
  if (!template || template.trim().length === 0) {
    throw new Error('Template is empty.');
  }

  // Check for the key business name placeholder used in the elegant template
  if (!template.includes('{{BUSINESS_NAME}}') && !template.includes('{{name}}')) {
    throw new Error(`Template is missing required core placeholders.`);
  }
  return true;
}

/**
 * 3. Sanitize Data
 */
export function sanitizeData(data) {
  if (!data) throw new Error("Lead data is missing.");

  const escape = (s) => (s || '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const llm = data.llm_structured_data || {};
  
  // Validation and Sanitization logic
  const validateServices = (arr) => {
    if (!Array.isArray(arr) || arr.length !== 3) return false;
    const clean = arr.map(s => typeof s === 'string' ? s.trim().replace(/[^a-zA-Z0-9\s-]/g, '') : '');
    if (clean.some(s => s.length === 0)) return false;
    // Removed uniqueness check to allow similar service titles if needed, but keeping exactly 3 items
    return clean;
  };

  const validateDescriptions = (arr) => {
    if (!Array.isArray(arr) || arr.length !== 3) return false;
    const clean = arr.map(s => typeof s === 'string' ? s.trim() : '');
    if (clean.some(s => s.length < 5)) return false;
    return clean;
  };

  const validateKeywords = (arr) => {
    if (!Array.isArray(arr) || arr.length !== 3) return false;
    const clean = arr.map(s => {
      if (typeof s !== 'string') return '';
      // lower case, remove special chars, split into words
      let words = s.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
      if (words.length === 0 || words[0] === '') return '';
      if (words.length > 2) return ''; // 1-2 words max
      return words.join('-'); // convert spaces to hyphens
    });
    if (clean.some(s => s.length === 0)) return false;
    return clean;
  };

  const validServices = validateServices(llm.services);
  const validDescs = validateDescriptions(llm.service_descriptions);
  const validKeywords = validateKeywords(llm.image_keywords);

  // LOG FALLBACK USAGE
  if (!validServices || !validDescs) console.log(`  [SAFETY] Invalid services/descriptions for "${data.name}", using production fallbacks.`);
  if (!validKeywords) console.log(`  [SAFETY] Invalid keywords for "${data.name}", using production fallbacks.`);

  const services = validServices || ["Quality Service", "Expert Team", "Trusted Professionals"];
  const service_descriptions = validDescs || [
    "Professional service tailored to your business needs.",
    "Experienced team delivering reliable results every time.",
    "Focused on quality and customer satisfaction."
  ];
  const image_keywords = validKeywords || ["business", "service", "professional"];

  return {
    name: escape(data.name) || 'Business Name',
    tagline: escape(data.tagline) || 'Quality Services You Can Trust',
    description: escape(data.description) || 'We are dedicated to providing excellent service and a fantastic experience.',
    style: (data.style || 'modern').toLowerCase().trim(),
    niche: escape(data.niche || data.category || 'business').toLowerCase().trim(),
    services: services.map(escape),
    service_descriptions: service_descriptions.map(escape),
    image_keywords: image_keywords.map(escape),
    // Real contact info from DB
    phone: escape(data.phone) || 'Contact us',
    address: escape(data.address) || 'Visit our location',
    city: escape(data.city) || ''
  };
}

/**
 * 4. Apply Style
 */
export function applyStyle(style) {
  const styles = {
    modern:  { primary_color: '#1a1a2e', accent_color: '#e8e8f4' },
    classic: { primary_color: '#0d1b2a', accent_color: '#e8e0d0' },
    cozy:    { primary_color: '#5c3317', accent_color: '#fdf0e0' },
    premium: { primary_color: '#1a1104', accent_color: '#d4a017' },
    vibrant: { primary_color: '#1a0540', accent_color: '#f0e6ff' },
    minimal: { primary_color: '#2c2c2c', accent_color: '#f5f5f5' },
    default: { primary_color: '#333333', accent_color: '#ffffff' },
  };

  return styles[style] || styles.default;
}

/**
 * 5. Generate Slug
 */
export function generateSlug(name) {
  const slug = (name || 'demo')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  return slug || 'demo';
}

/**
 * 6. Inject Data
 * Pure deterministic rendering. Maps provided fields to placeholders.
 */
export function injectData(template, data) {
  let html = template;
  
  // Deterministic images based on Phase 2 keywords
  const kw1 = data.image_keywords[0] || 'interior';
  const kw2 = data.image_keywords[1] || 'detail';
  const kw3 = data.image_keywords[2] || 'product';

  const defaultImages = {
    HERO_BG_IMAGE: `https://loremflickr.com/1200/800/${kw1}`,
    ABOUT_IMAGE: `https://loremflickr.com/800/600/${kw2}`,
    BANNER_IMAGE: `https://loremflickr.com/1200/400/${kw3},abstract`,
    GALLERY_IMG_1: `https://loremflickr.com/800/600/${kw1},detail`,
    GALLERY_IMG_2: `https://loremflickr.com/800/600/${kw2},service`,
    GALLERY_IMG_3: `https://loremflickr.com/800/600/${kw3},product`,
  };

  // Deterministic services based on Phase 2 text
  // Positional services mapping
  const services = {
    SERVICE_1_ICON: '⭐', SERVICE_1_TITLE: data.services[0], SERVICE_1_DESC: data.service_descriptions[0],
    SERVICE_2_ICON: '🤝', SERVICE_2_TITLE: data.services[1], SERVICE_2_DESC: data.service_descriptions[1],
    SERVICE_3_ICON: '💬', SERVICE_3_TITLE: data.services[2], SERVICE_3_DESC: data.service_descriptions[2],
  };

  const defaultExtras = {
    ...services,
    STAT_1_LABEL: 'Happy Clients', STAT_1_NUM: '500+',
    STAT_2_LABEL: 'Years Active', STAT_2_NUM: '10+',
    STAT_3_LABEL: 'Projects Done', STAT_3_NUM: '1000+',
    TESTIMONIAL_AUTHOR: 'Satisfied Customer', TESTIMONIAL_TEXT: 'Absolutely fantastic experience!',
    CONTACT_ADDRESS: data.address, 
    CONTACT_PHONE: data.phone, 
    CONTACT_EMAIL: `hello@${data.name.toLowerCase().replace(/\s+/g, '')}.com`,
    BANNER_TITLE: 'Ready to start?', BANNER_TEXT: `Experience the best at ${data.name}.`
  };

  // Core mapping simple input -> elegant template format
  const map = {
    ...defaultImages,
    ...defaultExtras,
    BUSINESS_NAME: data.name,
    name: data.name,
    HERO_TITLE: data.name,
    HERO_SUBTEXT: data.tagline,
    tagline: data.tagline,
    ABOUT_TITLE: `About ${data.name}`,
    ABOUT_TEXT: data.description,
    description: data.description,
    primary_color: data.primary_color,
    accent_color: data.accent_color,
  };

  // Replace all known placeholders
  for (const [key, value] of Object.entries(map)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    html = html.replace(regex, value || '');
  }

  // More resilient CSS variables injection using a style block at the end of head
  const cssInjection = `
  <style>
    :root {
      --primary: ${data.primary_color || '#3d0101'} !important;
      --secondary: ${data.primary_color || '#3d0101'} !important;
      --accent: ${data.accent_color || '#f2e8cf'} !important;
    }
  </style>
  </head>`;
  html = html.replace('</head>', cssInjection);

  // Safety pass — blank out any remaining raw {{...}} placeholders
  html = html.replace(/\{\{[^}]+\}\}/g, '');

  return html;
}

/**
 * 7. Generate Demo
 */
export async function generateDemo(lead) {
  const template = loadTemplate();
  validateTemplate(template);

  const cleanData = sanitizeData(lead);
  const colors = applyStyle(cleanData.style);

  const injectionData = {
    ...cleanData,
    ...colors
  };

  const html = injectData(template, injectionData);

  // Content Validation
  if (!html.trim()) {
    throw new Error('Generated HTML is empty.');
  }

  const baseSlug = generateSlug(cleanData.name);
  if (!fs.existsSync(DEMO_OUT_DIR)) {
    fs.mkdirSync(DEMO_OUT_DIR, { recursive: true });
  }

  let filename = `${baseSlug}.html`;
  let filePath = path.join(DEMO_OUT_DIR, filename);
  let counter = 1;

  while (fs.existsSync(filePath)) {
    filename = `${baseSlug}-${counter}.html`;
    filePath = path.join(DEMO_OUT_DIR, filename);
    counter++;
  }

  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, html, 'utf8');
  fs.renameSync(tmpPath, filePath);

  const demo_url = `${BASE_URL}/demo/${filename}`;
  console.log(`  🌐 Demo generated: ${demo_url}`);

  return { demo_url, filePath };
}
