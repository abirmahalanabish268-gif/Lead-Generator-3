import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('WARNING: Missing Supabase credentials in process.env.');
}

const supabase = createClient(supabaseUrl || 'http://placeholder', supabaseKey || 'placeholder');

/**
 * Idempotently inserts or updates a normalized lead using the identity_hash.
 * Returns the data if successful.
 */
export async function upsertLead(normalizedLead) {
  const { data, error } = await supabase
    .from('leads')
    .upsert(normalizedLead, { onConflict: 'identity_hash', ignoreDuplicates: false })
    .select()
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`DB Error on upsert: ${error.message}`);
  }
  return data;
}

/**
 * Fetches leads by their state machine status.
 * @param {string} state e.g. 'INGESTED'
 * @param {number} limit max records to fetch
 */
export async function getLeadsByState(state, limit = 30) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', state)
    .limit(limit);

  if (error) {
    throw new Error(`DB Error on fetch: ${error.message}`);
  }
  return data || [];
}

/**
 * Atomically updates a lead's state and optional extra fields.
 */
export async function updateLeadState(id, newState, extraData = {}) {
  const { data, error } = await supabase
    .from('leads')
    .update({ status: newState, ...extraData })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`DB Error on update: ${error.message}`);
  }
  return data;
}

/**
 * Fetches the top N evaluated leads sorted by priority descending.
 * Strictly returns only contactable leads (should_contact = true).
 * @param {number} limit how many top leads to return
 */
export async function getTopLeads(limit = 10) {
  // Primary: should_contact = true, sorted by priority DESC
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'EVALUATED')
    .eq('should_contact', true)
    .order('priority', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`DB Error fetching top leads: ${error.message}`);

  return data || [];
}

/**
 * Persists the demo_url for a lead.
 * Does NOT overwrite if demo_url already exists (idempotent).
 */
export async function saveDemoUrl(id, demo_url) {
  // Only update if demo_url is not already set
  const { data: existing } = await supabase
    .from('leads')
    .select('demo_url')
    .eq('id', id)
    .single();

  if (existing?.demo_url) {
    console.log(`  ℹ️  demo_url already set, skipping overwrite.`);
    return existing.demo_url;
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ demo_url })
    .eq('id', id)
    .select('demo_url')
    .single();

  if (error) throw new Error(`DB Error saving demo_url: ${error.message}`);
  return data?.demo_url;
}
