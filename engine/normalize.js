import crypto from 'crypto';

/**
 * Normalizes raw scraper data and generates a deterministic identity hash.
 * This ensures that the same cafe scraped multiple times always maps to the same DB record.
 */
export function normalizeLead(rawLead) {
  // 1. Sanitize and normalize fields
  const cleanStr = (s) => (s || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const name = (rawLead.name || 'Unknown Business').trim();
  const city = (rawLead.city || 'Unknown City').trim();
  const address = (rawLead.address || '').trim();
  const phone = (rawLead.phone || '').replace(/\D/g, ''); 
  const category = (rawLead.category || 'General').trim();
  const website = (rawLead.website || '').trim();

  // website_quality: Forward compatible quality signal
  const website_quality = website ? 'unknown' : 'none';

  // 2. Generate deterministic identity hash based on priority rules
  let hashInput;
  if (phone && phone.length >= 7) {
    // Primary: Phone number (normalized to digits)
    hashInput = `phone:${phone}`;
  } else {
    // Fallback: Normalized Name + City + Partial Address (for multiple branches)
    const partialAddr = cleanStr(address.split(',')[0]); // Use first part of address
    hashInput = `namecityaddr:${cleanStr(name)}|${cleanStr(city)}|${partialAddr}`;
  }

  const identity_hash = crypto.createHash('sha256').update(hashInput).digest('hex');

  return {
    identity_hash,
    name,
    city,
    address,
    category,
    phone,
    website,
    website_quality,
    status: 'INGESTED'
  };
}
