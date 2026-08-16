<script>
  import { app } from './state.svelte.js';
  import { saveActivity, removeActivity } from './actions.svelte.js';

  let dialog = $state(null);
  let draft = $state(null);      // a copy — edits only land on save
  let saving = $state(false);
  let error = $state('');

  const KINDS = ['hike', 'flight', 'drive', 'plan', 'food', 'rest', 'holiday', 'booking', 'custom'];
  const STATUSES = [['todo', 'Not booked'], ['pending', 'Waiting on them'], ['done', 'Booked']];

  export function open(activity) {
    draft = {
      ...activity,
      booking: activity.booking ? { ...activity.booking } : null
    };
    error = '';
    dialog.showModal();
  }

  function toggleBooking() {
    draft.booking = draft.booking
      ? null
      : { needed: true, status: 'todo', due: null, cost: null, currency: 'EUR', ref: null, url: null, note: null };
  }

  /** Empty inputs must become null, not '' or 0 — an empty field means unknown. */
  function clean(v, asNumber = false) {
    if (v === '' || v === undefined || v === null) return null;
    if (asNumber) { const n = Number(v); return Number.isFinite(n) ? n : null; }
    return v;
  }

  async function save(e) {
    e.preventDefault();
    if (saving) return;
    saving = true; error = '';
    const patch = {
      title: draft.title?.trim() || 'Untitled',
      kind: clean(draft.kind),
      start_time: clean(draft.start_time),
      duration_min: clean(draft.duration_min, true),
      distance_km: clean(draft.distance_km, true),
      ascent_m: clean(draft.ascent_m, true),
      descent_m: clean(draft.descent_m, true),
      difficulty: clean(draft.difficulty),
      map_url: clean(draft.map_url),
      trailhead: clean(draft.trailhead),
      parking: clean(draft.parking),
      transport: clean(draft.transport),
      food_water: clean(draft.food_water),
      backup_plan: clean(draft.backup_plan),
      notes: clean(draft.notes),
      booking: draft.booking
        ? {
            ...draft.booking,
            needed: true,
            cost: clean(draft.booking.cost, true),
            due: clean(draft.booking.due),
            ref: clean(draft.booking.ref),
            url: clean(draft.booking.url),
            note: clean(draft.booking.note)
          }
        : null
    };
    try {
      await saveActivity(draft.id, patch);
      dialog.close();
    } catch (err) {
      console.error('could not save activity', draft.id, err);
      error = err.message ?? 'Could not save that.';
    } finally {
      saving = false;
    }
  }

  async function destroy() {
    if (!confirm(`Delete "${draft.title}"? This cannot be undone.`)) return;
    saving = true;
    try {
      await removeActivity(draft.id);
      dialog.close();
    } catch (err) {
      error = err.message ?? 'Could not delete that.';
    } finally {
      saving = false;
    }
  }
</script>

<dialog bind:this={dialog} class="editor">
  {#if draft}
    <form class="modal-in" onsubmit={save}>
      <h3>Edit activity</h3>

      <div class="field">
        <label for="ae-title">Title</label>
        <input id="ae-title" bind:value={draft.title} maxlength="200" required />
      </div>

      <div class="row">
        <div class="field">
          <label for="ae-kind">Type</label>
          <select id="ae-kind" bind:value={draft.kind}>
            {#each KINDS as k}<option value={k}>{k}</option>{/each}
          </select>
        </div>
        <div class="field">
          <label for="ae-time">Start</label>
          <input id="ae-time" type="time" bind:value={draft.start_time} />
        </div>
        <div class="field">
          <label for="ae-dur">Minutes</label>
          <input id="ae-dur" type="number" min="0" bind:value={draft.duration_min} />
        </div>
      </div>

      <fieldset>
        <legend>The walk</legend>
        <div class="row">
          <div class="field"><label for="ae-km">Distance km</label>
            <input id="ae-km" type="number" step="0.1" min="0" bind:value={draft.distance_km} /></div>
          <div class="field"><label for="ae-up">Ascent m</label>
            <input id="ae-up" type="number" min="0" bind:value={draft.ascent_m} /></div>
          <div class="field"><label for="ae-down">Descent m</label>
            <input id="ae-down" type="number" min="0" bind:value={draft.descent_m} /></div>
        </div>
        <div class="row">
          <div class="field"><label for="ae-diff">Difficulty</label>
            <input id="ae-diff" bind:value={draft.difficulty} placeholder="easy / moderate / exposed" /></div>
          <div class="field grow"><label for="ae-map">Map link</label>
            <input id="ae-map" type="url" bind:value={draft.map_url} placeholder="https://…" /></div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Getting there</legend>
        <div class="field"><label for="ae-th">Trailhead</label><input id="ae-th" bind:value={draft.trailhead} /></div>
        <div class="field"><label for="ae-park">Parking</label><input id="ae-park" bind:value={draft.parking} /></div>
        <div class="field"><label for="ae-trans">Transport</label><input id="ae-trans" bind:value={draft.transport} /></div>
      </fieldset>

      <fieldset>
        <legend>On the day</legend>
        <div class="field"><label for="ae-food">Food and water</label><input id="ae-food" bind:value={draft.food_water} /></div>
        <div class="field"><label for="ae-rain">Rain / backup plan</label><input id="ae-rain" bind:value={draft.backup_plan} /></div>
        <div class="field"><label for="ae-notes">Notes</label><textarea id="ae-notes" rows="4" bind:value={draft.notes}></textarea></div>
      </fieldset>

      <fieldset>
        <legend>
          <label class="inline">
            <input type="checkbox" checked={!!draft.booking} onchange={toggleBooking} />
            Needs booking or paying
          </label>
        </legend>
        {#if draft.booking}
          <div class="row">
            <div class="field"><label for="ae-status">Status</label>
              <select id="ae-status" bind:value={draft.booking.status}>
                {#each STATUSES as [v, l]}<option value={v}>{l}</option>{/each}
              </select></div>
            <div class="field"><label for="ae-due">Due</label>
              <input id="ae-due" bind:value={draft.booking.due} placeholder="NOW / this week" /></div>
            <div class="field"><label for="ae-cost">Cost</label>
              <input id="ae-cost" type="number" min="0" step="0.01" bind:value={draft.booking.cost} /></div>
          </div>
          <div class="row">
            <div class="field"><label for="ae-ref">Reference</label>
              <input id="ae-ref" bind:value={draft.booking.ref} placeholder="confirmation number" /></div>
            <div class="field grow"><label for="ae-url">Booking link</label>
              <input id="ae-url" type="url" bind:value={draft.booking.url} /></div>
          </div>
        {/if}
      </fieldset>

      {#if error}<div class="error">{error}</div>{/if}

      <div class="modal-actions">
        <button type="button" class="btn ghost danger" onclick={destroy} disabled={saving}>Delete</button>
        <span class="spacer"></span>
        <button type="button" class="btn ghost" onclick={() => dialog.close()} disabled={saving}>Cancel</button>
        <button type="submit" class="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  {/if}
</dialog>

<style>
  .editor { max-width: 640px; max-height: 88vh; }
  .editor form { overflow-y: auto; max-height: 88vh; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; }
  .row .field { flex: 1 1 130px; }
  .row .field.grow { flex: 3 1 220px; }
  fieldset { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px 4px; margin-bottom: 14px; }
  legend { font-size: 12px; font-weight: 600; color: var(--rock-soft); padding: 0 6px; }
  legend .inline { display: flex; align-items: center; gap: 7px; cursor: pointer; }
  legend input[type=checkbox] { width: 15px; height: 15px; accent-color: var(--pine); }
  .spacer { flex: 1; }
  .danger { color: var(--glow); }
  .danger:hover { background: var(--glow-soft); }
  @media (max-width: 640px) { .editor { max-width: 100vw; width: 100vw; max-height: 100vh; border-radius: 0; } }
</style>
