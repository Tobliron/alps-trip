import { app } from './state.svelte.js';
import {
  updateActivity, insertActivity, deleteActivity,
  reorderActivities, updateDay, logChange, cacheSet
} from './data.js';

/**
 * Mutations, kept apart from state.svelte.js so the read path and the write
 * path stay legible separately.
 *
 * All of these edit the in-memory state first and persist after. If the write
 * fails the local change is rolled back, because a checklist that silently
 * disagrees with the database is worse than one that says "that did not save".
 */

function persistCache() {
  if (app.tripId && app.bundle) cacheSet('bundle:' + app.tripId, app.bundle);
}

/** Every activity in the trip, scheduled or not. */
export function allActivities() {
  const onDays = (app.bundle?.days ?? []).flatMap(d => d.activities ?? []);
  return onDays.concat(app.bundle?.unscheduled ?? []);
}

export function findActivity(id) {
  return allActivities().find(a => a.id === id) ?? null;
}

function replaceActivity(id, patch) {
  for (const d of app.bundle?.days ?? []) {
    const i = (d.activities ?? []).findIndex(a => a.id === id);
    if (i !== -1) { d.activities[i] = { ...d.activities[i], ...patch }; return; }
  }
  const j = (app.bundle?.unscheduled ?? []).findIndex(a => a.id === id);
  if (j !== -1) app.bundle.unscheduled[j] = { ...app.bundle.unscheduled[j], ...patch };
}

export async function saveActivity(id, patch) {
  const before = findActivity(id);
  if (!before) throw new Error('that activity is no longer here');
  replaceActivity(id, patch);
  persistCache();
  try {
    await updateActivity(id, patch);
    logChange(app.tripId, app.who ?? 'someone', `edited "${patch.title ?? before.title}"`, 'activity', id);
  } catch (e) {
    replaceActivity(id, before);          // put it back
    persistCache();
    throw e;
  }
}

export async function addActivity(dayId) {
  const row = {
    trip_id: app.tripId,
    day_id: dayId,
    title: 'New activity',
    kind: 'plan',
    sort_order: nextSortOrder(dayId)
  };
  const created = await insertActivity(row);
  if (dayId) {
    const day = app.bundle.days.find(d => d.id === dayId);
    (day.activities ||= []).push(created);
  } else {
    (app.bundle.unscheduled ||= []).push(created);
  }
  persistCache();
  logChange(app.tripId, app.who ?? 'someone', 'added an activity', 'activity', created.id);
  return created;
}

function nextSortOrder(dayId) {
  const list = dayId
    ? (app.bundle.days.find(d => d.id === dayId)?.activities ?? [])
    : (app.bundle.unscheduled ?? []);
  return list.reduce((m, a) => Math.max(m, a.sort_order ?? 0), -1) + 1;
}

export async function removeActivity(id) {
  const before = findActivity(id);
  const day = (app.bundle?.days ?? []).find(d => (d.activities ?? []).some(a => a.id === id));
  if (day) day.activities = day.activities.filter(a => a.id !== id);
  else if (app.bundle?.unscheduled) app.bundle.unscheduled = app.bundle.unscheduled.filter(a => a.id !== id);
  persistCache();
  try {
    await deleteActivity(id);
    logChange(app.tripId, app.who ?? 'someone', `deleted "${before?.title ?? 'an activity'}"`, 'activity', id);
  } catch (e) {
    await reload();                       // simplest correct rollback for a delete
    throw e;
  }
}

/**
 * Commit a drag: `dayId` is the list that changed (null = the unscheduled
 * backlog) and `items` is its new order. Rewrites sort_order for that list and
 * reassigns day_id for anything that moved between lists.
 */
export async function commitMove(dayId, items, prevIds = null) {
  const rows = items.map((a, i) => ({
    id: a.id,
    trip_id: app.tripId,
    day_id: dayId,
    sort_order: i
  }));
  if (!rows.length) return;
  persistCache();
  try {
    await reorderActivities(rows);
    // Which item arrived from elsewhere? Ask what was in this list before,
    // rather than inferring from day_id — an item whose day_id is merely
    // absent would otherwise be mistaken for the one that moved, and the
    // change log would name the wrong activity.
    const moved = prevIds ? items.find(a => !prevIds.has(a.id)) : null;
    if (moved) {
      const day = app.bundle.days.find(d => d.id === dayId);
      const where = day ? new Date(day.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'the backlog';
      logChange(app.tripId, app.who ?? 'someone', `moved "${moved.title}" to ${where}`, 'activity', moved.id);
    }
    // keep the local rows consistent with what we just wrote
    items.forEach((a, i) => { a.day_id = dayId; a.sort_order = i; });
    persistCache();
  } catch (e) {
    console.error('could not save the new order', e);
    await reload();
    throw e;
  }
}

export async function saveDay(id, patch) {
  const day = app.bundle.days.find(d => d.id === id);
  const before = { ...day };
  Object.assign(day, patch);
  persistCache();
  try {
    await updateDay(id, patch);
    logChange(app.tripId, app.who ?? 'someone', `edited ${day.date}`, 'day', id);
  } catch (e) {
    Object.assign(day, before);
    persistCache();
    throw e;
  }
}

async function reload() {
  const { loadTrip } = await import('./state.svelte.js');
  await loadTrip(app.tripId);
}
