<script>
  import { app } from './state.svelte.js';
  import { saveActivity, removeActivity } from './actions.svelte.js';
  import FileStrip from './FileStrip.svelte';
  import { t } from './i18n.svelte.js';

  let dialog = $state(null);
  let draft = $state(null);      // a copy — edits only land on save
  let saving = $state(false);
  let error = $state('');

  const KINDS = ['hike', 'flight', 'drive', 'plan', 'food', 'rest', 'holiday', 'booking', 'custom'];
  const STATUSES = ['todo', 'pending', 'done'];

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
      <h3>{t('editor.title')}</h3>

      <div class="field">
        <label for="ae-title">{t('editor.field.title')}</label>
        <input id="ae-title" bind:value={draft.title} maxlength="200" required />
      </div>

      <div class="row">
        <div class="field">
          <label for="ae-kind">{t('editor.field.type')}</label>
          <select id="ae-kind" bind:value={draft.kind}>
            {#each KINDS as k}<option value={k}>{t('kind.' + k)}</option>{/each}
          </select>
        </div>
        <div class="field">
          <label for="ae-time">{t('editor.field.start')}</label>
          <input id="ae-time" type="time" bind:value={draft.start_time} />
        </div>
        <div class="field">
          <label for="ae-dur">{t('editor.field.minutes')}</label>
          <input id="ae-dur" type="number" min="0" bind:value={draft.duration_min} />
        </div>
      </div>

      <fieldset>
        <legend>{t('editor.walk')}</legend>
        <div class="row">
          <div class="field"><label for="ae-km">{t('editor.field.km')}</label>
            <input id="ae-km" type="number" step="0.1" min="0" bind:value={draft.distance_km} /></div>
          <div class="field"><label for="ae-up">{t('editor.field.ascent')}</label>
            <input id="ae-up" type="number" min="0" bind:value={draft.ascent_m} /></div>
          <div class="field"><label for="ae-down">{t('editor.field.descent')}</label>
            <input id="ae-down" type="number" min="0" bind:value={draft.descent_m} /></div>
        </div>
        <div class="row">
          <div class="field"><label for="ae-diff">{t('editor.field.difficulty')}</label>
            <input id="ae-diff" bind:value={draft.difficulty} /></div>
          <div class="field grow"><label for="ae-map">{t('editor.field.map')}</label>
            <input id="ae-map" type="url" bind:value={draft.map_url} placeholder="https://…" /></div>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t('editor.getting')}</legend>
        <div class="field"><label for="ae-th">{t('editor.field.trailhead')}</label><input id="ae-th" bind:value={draft.trailhead} /></div>
        <div class="field"><label for="ae-park">{t('editor.field.parking')}</label><input id="ae-park" bind:value={draft.parking} /></div>
        <div class="field"><label for="ae-trans">{t('editor.field.transport')}</label><input id="ae-trans" bind:value={draft.transport} /></div>
      </fieldset>

      <fieldset>
        <legend>{t('editor.onday')}</legend>
        <div class="field"><label for="ae-food">{t('editor.field.food')}</label><input id="ae-food" bind:value={draft.food_water} /></div>
        <div class="field"><label for="ae-rain">{t('editor.field.rain')}</label><input id="ae-rain" bind:value={draft.backup_plan} /></div>
        <div class="field"><label for="ae-notes">{t('editor.field.notes')}</label><textarea id="ae-notes" rows="4" bind:value={draft.notes}></textarea></div>
      </fieldset>

      <fieldset>
        <legend>
          <label class="inline">
            <input type="checkbox" checked={!!draft.booking} onchange={toggleBooking} />
            {t('editor.booking')}
          </label>
        </legend>
        {#if draft.booking}
          <div class="row">
            <div class="field"><label for="ae-status">{t('editor.field.status')}</label>
              <select id="ae-status" bind:value={draft.booking.status}>
                {#each STATUSES as v}<option value={v}>{t('status.' + v)}</option>{/each}
              </select></div>
            <div class="field"><label for="ae-due">{t('editor.field.due')}</label>
              <input id="ae-due" bind:value={draft.booking.due} /></div>
            <div class="field"><label for="ae-cost">{t('editor.field.cost')}</label>
              <input id="ae-cost" type="number" min="0" step="0.01" bind:value={draft.booking.cost} /></div>
          </div>
          <div class="row">
            <div class="field"><label for="ae-ref">{t('editor.field.ref')}</label>
              <input id="ae-ref" bind:value={draft.booking.ref} /></div>
            <div class="field grow"><label for="ae-url">{t('editor.field.url')}</label>
              <input id="ae-url" type="url" bind:value={draft.booking.url} /></div>
          </div>
        {/if}
      </fieldset>

      <fieldset>
        <legend>{t('editor.files')}</legend>
        <p class="fine">{t('editor.filesHint')}</p>
        <FileStrip activityId={draft.id} kinds={['photo', 'gpx', 'receipt']} compact />
      </fieldset>

      {#if error}<div class="error">{error}</div>{/if}

      <div class="modal-actions">
        <button type="button" class="btn ghost danger" onclick={destroy} disabled={saving}>{t('editor.delete')}</button>
        <span class="spacer"></span>
        <button type="button" class="btn ghost" onclick={() => dialog.close()} disabled={saving}>{t('edit.cancel')}</button>
        <button type="submit" class="btn" disabled={saving}>{saving ? t('editor.saving') : t('editor.save')}</button>
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
  .fine { font-size: 12px; color: var(--rock-soft); margin-bottom: 6px; }
  .danger { color: var(--glow); }
  .danger:hover { background: var(--glow-soft); }
  @media (max-width: 640px) { .editor { max-width: 100vw; width: 100vw; max-height: 100vh; border-radius: 0; } }
</style>
