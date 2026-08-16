<script>
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import ActivityCard from './ActivityCard.svelte';
  import { app } from './state.svelte.js';
  import { commitMove, addActivity } from './actions.svelte.js';
  import { t } from './i18n.svelte.js';

  let { onedit } = $props();

  const FLIP = 160;
  let items = $derived(app.bundle?.unscheduled ?? []);

  function consider(e) { app.bundle.unscheduled = e.detail.items; }
  async function finalize(e) {
    const prevIds = new Set((app.bundle.unscheduled ?? []).map(a => a.id));
    const seen = new Set();
    const next = e.detail.items
      .filter(i => !i[SHADOW_ITEM_MARKER_PROPERTY_NAME])
      .filter(i => !seen.has(i.id) && seen.add(i.id));
    app.bundle.unscheduled = next;
    try { await commitMove(null, next, prevIds); } catch { /* commitMove reloads on failure */ }
  }

  async function add() { onedit?.(await addActivity(null)); }
</script>

<section class="backlog">
  <h2>{t('backlog.title')}</h2>
  <p class="sub">{app.editing ? t('backlog.hintEditing') : t('backlog.hintLocked')}</p>

  <div
    class="acts"
    class:dropzone={app.editing}
    use:dndzone={{ items, type: 'activity', flipDurationMs: FLIP, dragDisabled: !app.editing, dropTargetStyle: {} }}
    onconsider={consider}
    onfinalize={finalize}
  >
    {#each items as a (a.id)}
      <div animate:flip={{ duration: FLIP }}>
        <ActivityCard activity={a} {onedit} />
      </div>
    {/each}
  </div>

  {#if !items.length}
    <p class="empty">{t('backlog.empty')}</p>
  {/if}

  {#if app.editing}
    <button class="btn ghost sm" onclick={add}>{t('backlog.add')}</button>
  {/if}
</section>

<style>
  .backlog { margin-top: 28px; }
  .sub { color: var(--rock-soft); margin: 4px 0 14px; font-size: 13.5px; }
  .acts { display: flex; flex-direction: column; gap: 8px; min-height: 8px; }
  .acts.dropzone { min-height: 42px; border: 1px dashed var(--line); border-radius: 10px; padding: 6px; }
  .empty { font-size: 13px; color: var(--rock-soft); padding: 6px 0; }
  button { margin-top: 10px; }
</style>
