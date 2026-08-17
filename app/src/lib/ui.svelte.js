import { app } from './state.svelte.js';

/** Which section is showing, and the pending scroll target after a jump. */
export const ui = $state({
  tab: 'overview',
  jumpTo: null            // element id to scroll to once the tab has rendered
});

export const TABS = ['overview', 'days', 'calendar', 'map', 'budget', 'packing', 'notes', 'log', 'backup'];

export function goTab(tab, anchor = null) {
  ui.tab = TABS.includes(tab) ? tab : 'overview';
  ui.jumpTo = anchor;
  if (!anchor) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  /* The target does not exist until the new tab has rendered, so poll briefly
     for it.
     setTimeout, not requestAnimationFrame: rAF is paused entirely while the
     browser considers the tab hidden, so a jump fired around a tab switch or
     on a backgrounded page would never run at all. setTimeout still fires
     (throttled) and the loop is bounded either way. */
  const deadline = Date.now() + 2000;
  const tryScroll = () => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 1600);
      ui.jumpTo = null;
      return;
    }
    if (Date.now() < deadline) setTimeout(tryScroll, 40);
    else ui.jumpTo = null;
  };
  setTimeout(tryScroll, 0);
}

/**
 * Search everything the trip holds.
 *
 * Deliberately plain substring matching over the fields a person would
 * actually recall — titles, notes, place names, labels. No fuzzy scoring:
 * with a few hundred rows, "does it contain what I typed" is both faster to
 * reason about and less surprising than a ranking algorithm that decides a
 * near-miss was what you meant.
 */
export function search(query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (q.length < 2) return [];
  const b = app.bundle;
  if (!b) return [];

  const hit = (...fields) => fields.some(f => f && String(f).toLowerCase().includes(q));
  const out = [];

  for (const d of b.days ?? []) {
    if (hit(d.title, d.base_location, d.notes, d.date, d.holiday)) {
      out.push({ kind: 'day', label: d.title || d.date, sub: d.date, tab: 'days', anchor: 'day-' + d.date });
    }
    for (const a of d.activities ?? []) {
      if (hit(a.title, a.notes, a.trailhead, a.parking, a.transport, a.food_water, a.backup_plan, a.difficulty)) {
        out.push({ kind: 'activity', label: a.title, sub: d.date, tab: 'days', anchor: 'day-' + d.date });
      }
    }
  }

  for (const a of b.unscheduled ?? []) {
    if (hit(a.title, a.notes, a.booking?.note, a.booking?.ref, a.booking?.due)) {
      out.push({ kind: 'booking', label: a.title, sub: a.booking?.due ?? '', tab: 'days', anchor: 'backlog' });
    }
  }

  for (const n of b.notes ?? []) {
    if (hit(n.body, n.author)) {
      out.push({ kind: 'note', label: n.body.slice(0, 70), sub: n.author, tab: 'notes', anchor: null });
    }
  }

  for (const r of b.budget ?? []) {
    if (hit(r.label, r.note)) {
      out.push({ kind: 'budget', label: r.label, sub: r.est_amount != null ? '€' + r.est_amount : '', tab: 'budget', anchor: null });
    }
  }

  for (const p of b.packing ?? []) {
    if (hit(p.label, p.group_name)) {
      out.push({ kind: 'packing', label: p.label, sub: p.group_name, tab: 'packing', anchor: null });
    }
  }

  /* A hut day whose title and whose activity both mention "Lagazuoi" matched
     twice and listed the same line twice. One entry per destination. */
  const seen = new Set();
  return out
    .filter(r => {
      // Keyed on where it goes and what it says, NOT on kind: a day and its
      // activity can share a title, and two entries pointing at the same card
      // with the same words is just noise.
      const key = r.label + '|' + r.tab + '|' + (r.anchor ?? '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}
