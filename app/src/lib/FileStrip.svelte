<script>
  import { app } from './state.svelte.js';
  import { trip } from './state.svelte.js';
  import { uploadFile, removeFile, publicUrl, signedUrl, prettyBytes } from './storage.js';

  /**
   * Photos, GPX and confirmations for one day or one activity.
   * `kind` decides which bucket and how it renders.
   */
  let { dayId = null, activityId = null, kinds = ['photo'], compact = false } = $props();

  let input = $state(null);
  let pending = $state('');
  let error = $state('');
  let uploadKind = $state('photo');

  /* Files belonging to exactly this day, or exactly this activity.
     A day's strip must not also show its activities' photos. */
  let files = $derived(
    (app.bundle?.files ?? []).filter(f => {
      if (!kinds.includes(f.kind)) return false;
      if (activityId) return f.activity_id === activityId;
      if (dayId) return f.day_id === dayId && !f.activity_id;
      return !f.day_id && !f.activity_id;          // trip-level
    })
  );

  const LABEL = { photo: 'Photo', gpx: 'GPX track', receipt: 'Confirmation', doc: 'Document' };

  function choose(kind) {
    uploadKind = kind;
    input.accept = kind === 'photo' ? 'image/*' : kind === 'gpx' ? '.gpx,application/gpx+xml,text/xml' : '*/*';
    input.click();
  }

  async function onPick(ev) {
    const chosen = [...(ev.target.files ?? [])];
    ev.target.value = '';
    if (!chosen.length) return;
    error = '';
    for (const file of chosen) {
      pending = file.name;
      try {
        const row = await uploadFile(file, {
          tripSlug: trip.current?.slug ?? 'trip',
          tripId: app.tripId,
          kind: uploadKind,
          dayId, activityId,
          uploadedBy: app.who
        });
        (app.bundle.files ||= []).push(row);
      } catch (e) {
        console.error('upload failed for', file.name, e);
        error = e.message;
      }
    }
    pending = '';
  }

  async function drop(row) {
    if (!confirm(`Remove ${row.filename}?`)) return;
    try {
      await removeFile(row);
      app.bundle.files = app.bundle.files.filter(f => f.id !== row.id);
    } catch (e) {
      console.error('could not remove file', row.id, e);
      error = e.message;
    }
  }

  async function openPrivate(row) {
    try {
      window.open(await signedUrl(row), '_blank', 'noopener');
    } catch (e) {
      error = 'Could not open that file: ' + e.message;
    }
  }
</script>

<div class="strip" class:compact>
  {#each files as f (f.id)}
    {#if f.kind === 'photo'}
      <figure class="thumb">
        <img src={publicUrl(f)} alt={f.filename} loading="lazy" decoding="async" />
        {#if app.editing}<button class="x" title="Remove" onclick={() => drop(f)}>×</button>{/if}
      </figure>
    {:else}
      <div class="doc">
        <span class="tag mono">{LABEL[f.kind] ?? f.kind}</span>
        {#if f.bucket === 'trip-docs'}
          <button class="linkish" onclick={() => openPrivate(f)}>{f.filename}</button>
        {:else}
          <a href={publicUrl(f)} target="_blank" rel="noopener noreferrer">{f.filename}</a>
        {/if}
        <span class="size mono">{prettyBytes(f.bytes)}</span>
        {#if app.editing}<button class="x small" onclick={() => drop(f)}>×</button>{/if}
      </div>
    {/if}
  {/each}

  {#if app.editing}
    {#each kinds as k}
      <button class="add" onclick={() => choose(k)} disabled={!!pending}>
        + {LABEL[k] ?? k}
      </button>
    {/each}
    <input type="file" multiple bind:this={input} onchange={onPick} hidden />
  {/if}
</div>

{#if pending}<p class="note mono">uploading {pending}…</p>{/if}
{#if error}<p class="err">{error}</p>{/if}

<style>
  .strip { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 8px; }
  .thumb { position: relative; margin: 0; }
  .thumb img {
    width: 104px; height: 78px; object-fit: cover;
    border-radius: 8px; border: 1px solid var(--line); display: block; background: var(--ice);
  }
  .compact .thumb img { width: 74px; height: 56px; }
  .x {
    position: absolute; top: -6px; inset-inline-end: -6px;
    width: 20px; height: 20px; line-height: 1; border-radius: 50%;
    border: 1px solid var(--line); background: #fff; color: var(--glow); font-size: 14px;
  }
  .x:hover { background: var(--glow-soft); }
  .x.small { position: static; width: 18px; height: 18px; }
  .doc {
    display: flex; align-items: center; gap: 8px; font-size: 12.5px;
    border: 1px solid var(--line); border-radius: 8px; padding: 5px 9px; background: #fff;
  }
  .doc a, .doc .linkish { color: var(--pine); }
  .tag { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--rock-soft); }
  .size { font-size: 10.5px; color: var(--rock-soft); }
  .add {
    background: #fff; border: 1px dashed var(--line); border-radius: 8px;
    padding: 6px 11px; font-size: 12.5px; color: var(--pine);
  }
  .add:hover { background: var(--ice); }
  .note { font-size: 11.5px; color: var(--rock-soft); margin-top: 5px; }
  .err { font-size: 12.5px; color: #A03A55; margin-top: 5px; }
</style>
