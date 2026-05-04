import { supabase } from '../supabase.js';

/**
 * Checks if a cafe already exists in the database by name and city.
 */
export async function checkLeadExists(name, city) {
  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .eq('name', name)
    .eq('city', city)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
    console.error("Error checking lead:", error);
  }

  return !!data; // returns true if exists, false if not
}

/**
 * Saves a new lead to the database.
 */
export async function saveNewLead(leadData) {
  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        name: leadData.name,
        city: leadData.city,
        category: leadData.category,
        phone: leadData.phone,
        status: 'new'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving lead:", error);
    throw error;
  }
  
  return data;
}

/**
 * Updates an existing lead (e.g., adding generated message, demo URL, changing status)
 */
export async function updateLead(id, updates) {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Error updating lead:", error);
    throw error;
  }

  return data;
}

/**
 * Fetches all leads for the dashboard
 */
export async function fetchAllLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
  
  return data;
}
