/**
 * Exercises geo.js against the real Open-Meteo services. No key, no session,
 * read-only — so this can run any time without touching the trip.
 *
 *   node scripts/test-geo.mjs
 */
import { geocode, fetchForecast, describeWeather, forecastAvailable, daysAhead } from '../app/src/lib/geo.js';

let bad = 0;
const ok = (cond, label, extra = '') => {
  if (!cond) bad++;
  console.log(`  ${cond ? 'ok  ' : 'BAD '} ${label}${extra ? '  ' + extra : ''}`);
};

console.log('--- geocoding the trip\'s real base names ---');
for (const place of ["Cortina d'Ampezzo", 'Ortisei', 'Riva del Garda', 'Venice']) {
  const r = await geocode(place, 3);
  ok(r.length > 0, place.padEnd(20), r[0] ? `-> ${r[0].label} (${r[0].lat.toFixed(3)}, ${r[0].lon.toFixed(3)})` : 'no match');
}

console.log('\n--- the deliberately ambiguous ones ---');
for (const place of ['Cyprus (Limassol or Paphos)', 'Rifugio (Alta Via 1)']) {
  const r = await geocode(place, 5);
  console.log(`  "${place}" -> ${r.length} candidate(s)${r.length ? ': ' + r.slice(0, 3).map(x => x.label).join(' | ') : ''}`);
}
console.log('  (these are why a match is never auto-applied)');

console.log('\n--- forecast for Cortina, next few days ---');
const today = new Date();
const iso = d => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);
const fc = await fetchForecast(46.5369, 12.13903, iso(0), iso(5));
const dates = Object.keys(fc);
ok(dates.length >= 5, 'returned a range', `${dates.length} days: ${dates[0]} .. ${dates[dates.length - 1]}`);
const first = fc[dates[0]];
ok(typeof first.max === 'number' && typeof first.min === 'number', 'temperatures present',
   `${Math.round(first.min)}-${Math.round(first.max)}°C`);
ok(first.code !== undefined, 'weather code present', `${first.code} -> ${describeWeather(first.code).icon} ${describeWeather(first.code).text}`);

console.log('\n--- horizon logic against the real trip dates ---');
ok(forecastAvailable(iso(3)) === true, 'a date 3 days out is in range');
ok(forecastAvailable(iso(30)) === false, 'a date 30 days out is not');
ok(forecastAvailable('2026-09-17') === (daysAhead('2026-09-17') <= 16), 'trip start matches the horizon rule',
   `trip starts in ${daysAhead('2026-09-17')} days`);

console.log('\n--- every WMO code maps to something ---');
const unmapped = [0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]
  .filter(c => !describeWeather(c).text);
ok(unmapped.length === 0, 'all documented codes described', unmapped.length ? 'missing: ' + unmapped.join(',') : '');

console.log(bad ? `\n${bad} check(s) failed.` : '\nAll geo checks passed.');
process.exit(bad ? 1 : 0);
