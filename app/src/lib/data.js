import { supabase } from './supabase.js';
import { NS } from './config.js';

/* ---------------------------------------------------------------------------
 * Offline cache.
 *
 * Same principle the current site proved out: render from a local copy first
 * so the app is usable in a hut with no signal, then reconcile. Anything the
 * day view needs to display goes through here.
 * ------------------------------------------------------------------------- */
export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? null : JSON.parse(raw);
  } catch (e) {
    console.error('cache read failed for', key, e);
    return null;
  }
}
export function cacheSet(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch (e) {
    console.error('cache write failed for', key, e);
  }
}

/* ---------------------------------------------------------------------------
 * Reads. All of these work with the anon key — viewing never needs the
 * Edit password.
 * ------------------------------------------------------------------------- */
export async function fetchTrips() {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('archived', false)
    .order('sort_order')
    .order('start_date');
  if (error) throw error;
  return data;
}

/**
 * Everything one trip needs, in a single round trip. PostgREST embeds the
 * related rows, so this is one request rather than one per day — which
 * matters on a slow connection far more than it does on wifi.
 */
export async function fetchTripBundle(tripId) {
  const [days, unscheduled, budget, packing, people, notes] = await Promise.all([
    supabase.from('days')
      .select('*, activities(*)')
      .eq('trip_id', tripId)
      .order('date')
      .order('sort_order', { referencedTable: 'activities' }),
    supabase.from('activities').select('*').eq('trip_id', tripId).is('day_id', null).order('sort_order'),
    supabase.from('budget_items').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('packing_items').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('people').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('trip_notes_v2').select('*').eq('trip_id', tripId).order('created_at', { ascending: false })
  ]);

  for (const r of [days, unscheduled, budget, packing, people, notes]) {
    if (r.error) throw r.error;
  }
  return {
    days: days.data,
    unscheduled: unscheduled.data,
    budget: budget.data,
    packing: packing.data,
    people: people.data,
    notes: notes.data
  };
}

/* ---------------------------------------------------------------------------
 * Writes. Every one of these fails without an unlocked session — that is the
 * RLS policy doing its job, not a check we perform here.
 * ------------------------------------------------------------------------- */
export async function updateActivity(id, patch) {
  const { error } = await supabase.from('activities').update(patch).eq('id', id);
  if (error) throw error;
}

export async function updateDay(id, patch) {
  const { error } = await supabase.from('days').update(patch).eq('id', id);
  if (error) throw error;
}

export async function insertActivity(row) {
  const { data, error } = await supabase.from('activities').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deleteActivity(id) {
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
}

/** Drag-and-drop writes this: new day and position for a batch of activities. */
export async function reorderActivities(rows) {
  const { error } = await supabase.from('activities').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function logChange(tripId, author, action, entity, entityId) {
  const { error } = await supabase.from('change_log').insert({
    trip_id: tripId, author, action, entity, entity_id: entityId ?? null
  });
  if (error) console.error('could not write to the change log:', error);   // never block the edit
}
