<script>
  import { app, trip, loadTrip } from './state.svelte.js';
  import { exportTrip, importTrip, download, validate, comparable, cloneWithNewIds, deleteTrip } from './portable.js';
  import { t } from './i18n.svelte.js';

  let busy = $state('');
  let message = $state('');
  let problem = $state('');
  let fileInput = $state(null);

  async function doExport() {
    busy = 'export'; message = ''; problem = '';
    try {
      const doc = await exportTrip(app.tripId);
      download(doc, `${trip.current?.slug ?? 'trip'}-${new Date().toISOString().slice(0, 10)}.json`);
      message = `Exported ${doc.days.length} days and ${doc.activities.length} activities.`;
    } catch (e) {
      console.error('export failed', e);
      problem = e.message;
    } finally { busy = ''; }
  }

  async function doImport(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    message = ''; problem = '';

    let doc;
    try {
      doc = JSON.parse(await file.text());
    } catch (e) {
      problem = 'That file is not valid JSON.';
      return;
    }
    const issues = validate(doc);
    if (issues.length) { problem = 'Cannot import:\n- ' + issues.join('\n- '); return; }

    const ok = confirm(
      `Replace "${doc.trip.title}" with the contents of this file?\n\n` +
      `${doc.days.length} days, ${doc.activities.length} activities.\n\n` +
      `Anything changed since that file was exported will be lost.`
    );
    if (!ok) return;

    busy = 'import';
    try {
      // A restore deletes the current trip before writing the file's version.
      // Save what is about to be replaced first, so a failure part-way through
      // is recoverable from a file rather than gone.
      try {
        const safety = await exportTrip(app.tripId);
        download(safety, `before-restore-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
      } catch (e) {
        console.error('could not take a pre-restore backup', e);
        if (!confirm('Could not save a backup of the current trip first. Restore anyway?')) { busy = ''; return; }
      }

      const counts = await importTrip(doc);
      await loadTrip(doc.trip.id);
      message = `Restored ${counts.days} days, ${counts.activities} activities, ${counts.budget} budget rows, ${counts.packing} packing items. A copy of the previous version was downloaded first.`;
    } catch (e) {
      console.error('import failed', e);
      problem = e.message;
    } finally { busy = ''; }
  }

  /**
   * Proves the promise in the plan: export -> import -> export must match.
   *
   * Runs against a throwaway clone with fresh ids, never the real trip, so a
   * failure cannot damage anything. The clone is deleted either way.
   */
  async function roundTrip() {
    busy = 'check'; message = ''; problem = '';
    let cloneId = null;
    try {
      const original = await exportTrip(app.tripId);
      const clone = cloneWithNewIds(original);
      cloneId = clone.trip.id;

      await importTrip(clone);
      const reExported = await exportTrip(cloneId);

      const a = JSON.stringify(comparable(clone));
      const b = JSON.stringify(comparable(reExported));
      if (a === b) {
        message = `Round-trip verified losslessly: ${clone.days.length} days, ${clone.activities.length} activities, `
                + `${clone.budget_items.length} budget rows, ${clone.packing_items.length} packing items — `
                + 'identical after export, import and export again.';
      } else {
        const firstDiff = [...a].findIndex((ch, i) => ch !== b[i]);
        problem = 'Round-trip FAILED — data changed on the way through.\n'
                + `First difference near: ${a.slice(Math.max(0, firstDiff - 60), firstDiff + 60)}`;
      }
    } catch (e) {
      console.error('round-trip check failed', e);
      problem = e.message;
    } finally {
      if (cloneId) {
        try { await deleteTrip(cloneId); } catch (e) { console.error('could not remove the check copy', e); }
      }
      await loadTrip(app.tripId);
      busy = '';
    }
  }
</script>

<section class="data">
  <h2>{t('data.title')}</h2>
  <p class="sub">{t('data.blurb')}</p>

  <div class="row">
    <button class="btn ghost" onclick={doExport} disabled={!!busy}>
      {busy === 'export' ? t('data.exporting') : t('data.export')}
    </button>

    {#if app.editing}
      <button class="btn ghost" onclick={() => fileInput.click()} disabled={!!busy}>
        {busy === 'import' ? t('data.importing') : t('data.import')}
      </button>
      <button class="btn ghost" onclick={roundTrip} disabled={!!busy}>
        {busy === 'check' ? t('data.verifying') : t('data.verify')}
      </button>
    {/if}
    <input type="file" accept="application/json,.json" bind:this={fileInput} onchange={doImport} hidden />
  </div>

  {#if !app.editing}
    <p class="hint">{t('data.lockedHint')}</p>
  {/if}
  {#if message}<p class="ok">{message}</p>{/if}
  {#if problem}<pre class="bad">{problem}</pre>{/if}
</section>

<style>
  .data { margin-top: 34px; padding-top: 22px; border-top: 1px solid var(--line); }
  .sub { color: var(--rock-soft); margin: 4px 0 14px; font-size: 13.5px; max-width: 620px; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
  .hint, .ok { font-size: 13px; margin-top: 10px; }
  .hint { color: var(--rock-soft); }
  .ok { color: var(--pine); }
  .bad {
    color: #A03A55; font-size: 13px; margin-top: 10px; white-space: pre-wrap;
    font-family: var(--font-body); background: var(--glow-soft);
    padding: 10px 12px; border-radius: 8px;
  }
</style>
