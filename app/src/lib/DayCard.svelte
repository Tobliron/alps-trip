<script>
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import ActivityCard from './ActivityCard.svelte';
  import FileStrip from './FileStrip.svelte';
  import { app } from './state.svelte.js';
  import { commitMove, addActivity, saveDay } from './actions.svelte.js';

  let { day, isToday = false, onedit } = $props();

  const PHASE_LABEL = {
    cyprus: 'Cyprus', cortina: 'Cortina', huts: 'Hut trek',
    gardena: 'Val Gardena', garda: 'Lake Garda', venice: 'Venice'
  };
  const FLIP = 160;

  let dateLabel = $derived(
    day.date
      ? new Date(day.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : ''
  );

  /* svelte-dnd-action owns this array while a drag is in flight, so it has to
     be a plain local list that we hand back to the store on finalize. */
  let items = $derived(day.activities ?? []);
  let busy = $state(false);

  function consider(e) {
    day.activities = e.detail.items;
  }
  async function finalize(e) {
    // Strip the placeholder the library injects for the item under the cursor,
    // and guard against a duplicate id, which would crash the keyed #each.
    const prevIds = new Set((day.activities ?? []).map(a => a.id));
    const seen = new Set();
    const next = e.detail.items
      .filter(i => !i[SHADOW_ITEM_MARKER_PROPERTY_NAME])
      .filter(i => !seen.has(i.id) && seen.add(i.id));
    day.activities = next;
    busy = true;
    try {
      await commitMove(day.id, next, prevIds);
    } catch {
      /* commitMove reloads from the server on failure, so the view self-corrects */
    } finally {
      busy = false;
    }
  }

  async function add() {
    const created = await addActivity(day.id);
    onedit?.(created);
  }

  let editingTitle = $state(false);
  let titleDraft = $state('');
  function startTitle() { titleDraft = day.title ?? ''; editingTitle = true; }
  async function commitTitle() {
    editingTitle = false;
    const v = titleDraft.trim() || null;
    if (v !== (day.title ?? null)) await saveDay(day.id, { title: v });
  }
</script>

<section class="day" class:today={isToday} class:busy id={day.date ? 'day-' + day.date : undefined}>
  <header>
    {#if dateLabel}<span class="date mono">{dateLabel}</span>{/if}
    {#if isToday}<span class="pill hot">Today</span>{/if}
    {#if day.phase && PHASE_LABEL[day.phase]}<span class="phase mono">{PHASE_LABEL[day.phase]}</span>{/if}
    {#if day.holiday}<span class="pill warn">{day.holiday}</span>{/if}
  </header>

  {#if app.editing && day.id}
    {#if editingTitle}
      <input class="title-edit" bind:value={titleDraft} onblur={commitTitle}
             onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
    {:else}
      <button class="title-btn" onclick={startTitle}>
        {day.title || 'Add a title'}
      </button>
    {/if}
  {:else if day.title}
    <h3>{day.title}</h3>
  {/if}

  {#if day.base_location}<div class="base mono">sleeping · {day.base_location}</div>{/if}

  <div
    class="acts"
    class:dropzone={app.editing}
    use:dndzone={{
      items,
      type: 'activity',
      flipDurationMs: FLIP,
      dragDisabled: !app.editing,
      dropTargetStyle: {}
    }}
    onconsider={consider}
    onfinalize={finalize}
  >
    {#each items as a (a.id)}
      <div animate:flip={{ duration: FLIP }}>
        <ActivityCard activity={a} {onedit} />
      </div>
    {/each}
  </div>

  {#if !items.length && !app.editing}
    <p class="empty">Nothing planned yet.</p>
  {/if}

  {#if day.id}
    <FileStrip dayId={day.id} kinds={['photo']} />
  {/if}

  {#if app.editing && day.id}
    <button class="btn ghost sm add" onclick={add}>+ Add activity</button>
  {/if}
</section>

<style>
  .day {
    background: var(--paper); border: 1px solid var(--line);
    border-radius: var(--radius); padding: 15px 16px; margin-bottom: 12px;
  }
  .day.today { border-color: var(--glow); box-shadow: 0 0 0 2px var(--glow-soft); }
  .day.busy { opacity: .7; }
  header { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-bottom: 5px; }
  .date { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--rock-soft); }
  .phase { font-size: 10.5px; color: var(--pine); }
  .base { font-size: 11.5px; color: var(--rock-soft); margin: 3px 0 10px; }
  .acts { display: flex; flex-direction: column; gap: 8px; min-height: 8px; }
  /* A visible target while editing, so an empty day is obviously droppable. */
  .acts.dropzone { min-height: 42px; border: 1px dashed var(--line); border-radius: 10px; padding: 6px; }
  .empty { font-size: 13px; color: var(--rock-soft); padding: 6px 0; }
  .add { margin-top: 10px; }
  .title-btn {
    display: block; width: 100%; text-align: start; background: none; border: 1px dashed var(--line);
    border-radius: 8px; padding: 4px 8px; font-family: var(--font-display); font-size: 19px;
    font-weight: 600; color: var(--rock);
  }
  .title-btn:hover { background: var(--ice); }
  .title-edit {
    width: 100%; font-family: var(--font-display); font-size: 19px; font-weight: 600;
    border: 1px solid var(--pine); border-radius: 8px; padding: 4px 8px;
  }
</style>
