/**
 * Checks the property that made the round-trip check fail: the order of rows
 * in an export must not depend on their ids.
 *
 * Exporting is read-only, so this runs with the public key and needs no
 * password. It exports the real trip, clones it with fresh random ids, and
 * confirms both documents still describe rows in the same sequence. If export
 * ordering leans on ids again, the sequences diverge and this fails.
 *
 *   node scripts/test-roundtrip-order.mjs
 */
import { exportTrip, cloneWithNewIds, comparable } from '../app/src/lib/portable.js';
import { supabase } from '../app/src/lib/supabase.js';

const { data: trips, error } = await supabase.from('trips').select('id,title').limit(1);
if (error) { console.error('could not reach Supabase:', error.message); process.exit(1); }
if (!trips.length) { console.error('no trips to check'); process.exit(1); }

const original = await exportTrip(trips[0].id);
const clone = cloneWithNewIds(original);

/** Describe a document by content, with every id stripped out. */
function shape(doc) {
  const dateOf = new Map(doc.days.map(d => [d.id, d.date]));
  return {
    days: doc.days.map(d => `${d.date}|${d.title ?? ''}`),
    activities: doc.activities.map(a => `${a.day_id ? dateOf.get(a.day_id) : '~'}|${a.sort_order}|${a.title}`),
    people: doc.people.map(p => `${p.sort_order}|${p.name}`),
    budget: doc.budget_items.map(b => `${b.sort_order}|${b.label}`),
    packing: doc.packing_items.map(p => `${p.sort_order}|${p.group_name}|${p.label}`)
  };
}

const a = shape(original);
const b = shape(clone);
let failures = 0;
for (const key of Object.keys(a)) {
  const same = JSON.stringify(a[key]) === JSON.stringify(b[key]);
  if (!same) {
    failures++;
    const i = a[key].findIndex((v, idx) => v !== b[key][idx]);
    console.error(`  BAD  ${key}: order differs at index ${i}\n       original: ${a[key][i]}\n       clone:    ${b[key][i]}`);
  } else {
    console.log(`  ok   ${key.padEnd(11)} ${a[key].length} rows in the same order after re-identifying`);
  }
}

// The id sets must be entirely disjoint, or the clone would collide with the real trip.
const ids = d => new Set([d.trip.id, ...d.days.map(x => x.id), ...d.activities.map(x => x.id)]);
const overlap = [...ids(original)].filter(id => ids(clone).has(id));
if (overlap.length) { failures++; console.error(`  BAD  clone reuses ${overlap.length} id(s) from the original`); }
else console.log(`  ok   ids          clone shares no ids with the original`);

// Field values themselves must be untouched by the clone.
const strip = d => JSON.stringify(comparable(d), (k, v) =>
  (k === 'id' || k.endsWith('_id') || k === 'slug') ? undefined : v);
if (strip(original) !== strip(clone)) { failures++; console.error('  BAD  cloning changed a non-id field'); }
else console.log('  ok   fields       cloning changed nothing except ids and the slug');

console.log(failures ? `\n${failures} check(s) failed.` : '\nOrdering is id-independent — the round-trip comparison will be valid.');
process.exit(failures ? 1 : 0);
