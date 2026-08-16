import { supabase } from './supabase.js';

/**
 * Export / import of one trip as a single human-readable JSON file.
 *
 * The file is meant to mirror what is in Supabase exactly, so that
 * export -> import -> export produces byte-identical JSON. That is why row ids
 * and created_at are included rather than regenerated: without them a restored
 * trip would be a copy rather than the same trip, and every re-import would
 * churn the file.
 */

export const SCHEMA_VERSION = 1;

/** Column lists, so export and import agree and a new column cannot be half-handled. */
const COLUMNS = {
  trips: ['id', 'slug', 'title', 'subtitle', 'start_date', 'end_date', 'cover_path', 'archived', 'sort_order', 'created_at'],
  people: ['id', 'trip_id', 'name', 'avatar_path', 'colour', 'sort_order'],
  days: ['id', 'trip_id', 'date', 'title', 'base_location', 'lat', 'lon', 'phase', 'holiday', 'notes', 'weather_cache'],
  activities: ['id', 'trip_id', 'day_id', 'sort_order', 'title', 'kind', 'start_time', 'duration_min',
    'trailhead', 'parking', 'transport', 'distance_km', 'ascent_m', 'descent_m', 'difficulty',
    'map_url', 'gpx_path', 'food_water', 'backup_plan', 'notes', 'booking', 'created_at'],
  budget_items: ['id', 'trip_id', 'label', 'est_amount', 'actual_amount', 'currency', 'note', 'sort_order'],
  packing_items: ['id', 'trip_id', 'group_name', 'label', 'packed', 'sort_order'],
  trip_notes_v2: ['id', 'trip_id', 'day_id', 'activity_id', 'author', 'body', 'created_at']
};

const pick = (row, cols) => Object.fromEntries(cols.map(c => [c, row[c] ?? null]));

/**
 * Ordering must not depend on ids.
 *
 * Sorting by id looked stable but is not: the round-trip check clones a trip
 * with fresh random ids, so the clone and its re-export came back in different
 * orders and compared unequal even though every field matched. Ordering by
 * what the rows actually mean — date, then position, then label — is both
 * id-independent and far more readable in the file, which is what the plan
 * asked for.
 */
const cmp = (...keys) => (a, b) => {
  for (const k of keys) {
    const x = k(a), y = k(b);
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
};
const str = v => (v === null || v === undefined ? '' : String(v));
const num = v => (v === null || v === undefined ? 0 : Number(v));

export async function exportTrip(tripId) {
  const q = async (table, cols) => {
    const { data, error } = await supabase.from(table).select(cols.join(',')).eq('trip_id', tripId);
    if (error) throw error;
    return data.map(r => pick(r, cols));
  };

  const { data: trips, error } = await supabase
    .from('trips').select(COLUMNS.trips.join(',')).eq('id', tripId).limit(1);
  if (error) throw error;
  if (!trips.length) throw new Error('that trip no longer exists');

  const days = await q('days', COLUMNS.days);
  const activities = await q('activities', COLUMNS.activities);
  const notes = await q('trip_notes_v2', COLUMNS.trip_notes_v2);

  // An activity's place in the file follows the day it is on, not its id.
  // Unscheduled ones sort last, which is also where they read best.
  const dateOf = new Map(days.map(d => [d.id, d.date]));
  const dayKey = a => (a.day_id ? str(dateOf.get(a.day_id)) : '~unscheduled');

  return {
    schema: SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    trip: pick(trips[0], COLUMNS.trips),
    people: (await q('people', COLUMNS.people))
      .sort(cmp(r => num(r.sort_order), r => str(r.name))),
    days: days
      .sort(cmp(r => str(r.date))),
    activities: activities
      .sort(cmp(dayKey, r => num(r.sort_order), r => str(r.title))),
    budget_items: (await q('budget_items', COLUMNS.budget_items))
      .sort(cmp(r => num(r.sort_order), r => str(r.label))),
    packing_items: (await q('packing_items', COLUMNS.packing_items))
      .sort(cmp(r => num(r.sort_order), r => str(r.group_name), r => str(r.label))),
    notes: notes
      .sort(cmp(r => str(r.created_at), r => str(r.author)))
  };
}

/** Everything except the timestamp, which is expected to differ between exports. */
export function comparable(doc) {
  const { exported_at, ...rest } = doc;
  return rest;
}

export function validate(doc) {
  const problems = [];
  if (!doc || typeof doc !== 'object') return ['that file is not a JSON object'];
  if (doc.schema !== SCHEMA_VERSION) problems.push(`schema version ${doc.schema ?? 'missing'}, expected ${SCHEMA_VERSION}`);
  if (!doc.trip?.id || !doc.trip?.slug) problems.push('no trip in the file');
  for (const k of ['people', 'days', 'activities', 'budget_items', 'packing_items', 'notes']) {
    if (!Array.isArray(doc[k])) problems.push(`"${k}" is missing or not a list`);
  }
  if (Array.isArray(doc.days) && Array.isArray(doc.activities)) {
    const dayIds = new Set(doc.days.map(d => d.id));
    const orphan = doc.activities.find(a => a.day_id && !dayIds.has(a.day_id));
    if (orphan) problems.push(`activity "${orphan.title}" points at a day that is not in the file`);
  }
  return problems;
}

/**
 * Restore a trip from an exported file.
 *
 * This REPLACES the trip: the existing rows are deleted (the foreign keys
 * cascade) and the file's rows are written back with their original ids. That
 * is what makes it a restore rather than a duplicate — but it also means any
 * change made since the export is discarded, which the caller must warn about.
 */
export async function importTrip(doc) {
  const problems = validate(doc);
  if (problems.length) throw new Error('That file cannot be imported:\n- ' + problems.join('\n- '));

  const del = await supabase.from('trips').delete().eq('id', doc.trip.id);
  if (del.error) throw del.error;

  const insert = async (table, rows) => {
    if (!rows.length) return;
    // Chunked: one 5,000-row request is a good way to hit a body limit.
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from(table).insert(rows.slice(i, i + 500));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  };

  await insert('trips', [doc.trip]);
  await insert('people', doc.people);
  await insert('days', doc.days);                 // before activities, which reference them
  await insert('activities', doc.activities);
  await insert('budget_items', doc.budget_items);
  await insert('packing_items', doc.packing_items);
  await insert('trip_notes_v2', doc.notes);

  return {
    days: doc.days.length,
    activities: doc.activities.length,
    budget: doc.budget_items.length,
    packing: doc.packing_items.length,
    notes: doc.notes.length
  };
}

/**
 * A copy of the document with every id replaced by a fresh one, and the slug
 * made unique.
 *
 * This exists so the round-trip check can prove fidelity without touching the
 * real trip: importing the clone creates a separate throwaway trip, which is
 * then exported, compared and deleted. An earlier version verified by importing
 * over the real trip — which deletes it first, so a failure part-way through
 * would have destroyed the thing it was checking.
 */
export function cloneWithNewIds(doc) {
  const map = new Map();
  const fresh = (id) => {
    if (id === null || id === undefined) return id;
    if (!map.has(id)) map.set(id, crypto.randomUUID());
    return map.get(id);
  };
  const remap = (rows, keys) => rows.map(r => {
    const out = { ...r };
    for (const k of keys) if (k in out) out[k] = fresh(out[k]);
    return out;
  });

  const trip = { ...doc.trip, id: fresh(doc.trip.id), slug: doc.trip.slug + '-roundtrip-check' };
  return {
    schema: doc.schema,
    exported_at: doc.exported_at,
    trip,
    people: remap(doc.people, ['id', 'trip_id']),
    days: remap(doc.days, ['id', 'trip_id']),
    activities: remap(doc.activities, ['id', 'trip_id', 'day_id']),
    budget_items: remap(doc.budget_items, ['id', 'trip_id']),
    packing_items: remap(doc.packing_items, ['id', 'trip_id']),
    notes: remap(doc.notes, ['id', 'trip_id', 'day_id', 'activity_id'])
  };
}

export async function deleteTrip(tripId) {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) throw error;
}

export function download(doc, filename) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
