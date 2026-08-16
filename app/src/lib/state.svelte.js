import { fetchTrips, fetchTripBundle, cacheGet, cacheSet } from './data.js';
import { currentSession, onAuthChange } from './supabase.js';
import { fetchForecast, forecastAvailable } from './geo.js';
import { NS } from './config.js';

/**
 * App state, as Svelte 5 runes. One module, imported wherever it's needed —
 * small enough that a store library would be ceremony.
 */
export const app = $state({
  trips: [],
  tripId: null,
  bundle: null,          // { days, unscheduled, budget, packing, people, notes }
  loading: true,
  offline: false,
  error: null,

  canEdit: false,        // is there a live Supabase session
  editing: false,        // has the user actually turned edit mode on
  who: null              // self-declared name, for the change log
});

export const trip = {
  get current() {
    return app.trips.find(t => t.id === app.tripId) ?? null;
  }
};

/**
 * Did the request fail because there is no connection, or because the server
 * answered and said no?
 *
 * These need different words in the UI. "Offline" tells you to go find signal;
 * a missing table or a rejected policy tells you to go fix the database. A
 * PostgREST error carries a `code`; a dead network throws a TypeError from
 * fetch before any response exists.
 */
function isNetworkError(e) {
  if (!e) return false;
  if (e.code || e.status || e.statusCode) return false;   // the server replied
  return e instanceof TypeError || /fetch|network|Load failed/i.test(e.message ?? '');
}

/** Days sorted, with their activities already ordered by the query. */
export function days() {
  return app.bundle?.days ?? [];
}

/** Today's day row, if the trip is running. Drives the Today view. */
export function today() {
  const iso = new Date().toISOString().slice(0, 10);
  return days().find(d => d.date === iso) ?? null;
}

/** Whole days until the trip starts. Negative once it has begun. */
export function daysUntilStart() {
  const t = trip.current;
  if (!t?.start_date) return null;
  const start = new Date(t.start_date + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((start - now) / 86400000);
}

export function setWho(name) {
  app.who = String(name ?? '').trim().slice(0, 40) || null;
  cacheSet('who', app.who);
}

export async function boot() {
  app.who = cacheGet('who');

  const session = await currentSession();
  app.canEdit = !!session;
  onAuthChange(s => {
    app.canEdit = !!s;
    if (!s) app.editing = false;      // signing out always drops edit mode
  });

  // Render the cached copy first so there is something on screen with no
  // signal, then go and get the real thing.
  const cachedTrips = cacheGet('trips');
  if (cachedTrips?.length) {
    app.trips = cachedTrips;
    app.tripId = cacheGet('tripId') ?? cachedTrips[0].id;
    app.bundle = cacheGet('bundle:' + app.tripId);
    app.loading = !app.bundle;
  }

  try {
    app.trips = await fetchTrips();
    cacheSet('trips', app.trips);
    if (!app.trips.length) { app.loading = false; return; }

    const wanted = cacheGet('tripId');
    app.tripId = app.trips.some(t => t.id === wanted) ? wanted : app.trips[0].id;
    await loadTrip(app.tripId);
    app.offline = false;
  } catch (e) {
    console.error('could not load trips:', e);
    app.offline = isNetworkError(e);
    // With a cached copy an offline blip is not worth an error card; a server
    // that actively refused us always is.
    app.error = (app.bundle && app.offline) ? null : e.message;
  } finally {
    app.loading = false;
  }

  // Weather last: it is the least important thing on the page and depends on a
  // third party, so nothing else should wait on it.
  refreshWeather();
}

export async function loadTrip(id) {
  app.tripId = id;
  cacheSet('tripId', id);
  const cached = cacheGet('bundle:' + id);
  if (cached) app.bundle = cached;
  try {
    app.bundle = await fetchTripBundle(id);
    cacheSet('bundle:' + id, app.bundle);
    app.offline = false;
  } catch (e) {
    console.error('could not load trip', id, e);
    app.offline = isNetworkError(e);
    if (!cached) app.error = e.message;
  }
}

export async function refresh() {
  if (app.tripId) await loadTrip(app.tripId);
}

/**
 * Fetch forecasts for every located day that is close enough to have one.
 *
 * Grouped by coordinate and requested as a date range, so a 24-day trip with
 * five bases costs five requests rather than twenty-four. Results are held in
 * the local cache only — showing the weather should not require the edit
 * password, and a forecast is disposable by nature.
 */
export async function refreshWeather() {
  const wanted = days().filter(d => d.lat != null && d.lon != null && forecastAvailable(d.date));
  if (!wanted.length) return;

  const groups = new Map();
  for (const d of wanted) {
    const key = `${Number(d.lat).toFixed(2)},${Number(d.lon).toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  for (const [key, group] of groups) {
    const [lat, lon] = key.split(',').map(Number);
    const dates = group.map(d => d.date).sort();
    try {
      const byDate = await fetchForecast(lat, lon, dates[0], dates[dates.length - 1]);
      const fetched_at = new Date().toISOString();
      for (const d of group) {
        if (byDate[d.date]) d.weather_cache = { data: byDate[d.date], fetched_at };
      }
    } catch (e) {
      console.error('could not fetch the forecast for', key, e);
    }
  }
  if (app.tripId && app.bundle) cacheSet('bundle:' + app.tripId, app.bundle);
}
