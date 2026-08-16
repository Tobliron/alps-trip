<script>
  import ActivityCard from './ActivityCard.svelte';
  import { app } from './state.svelte.js';

  let { day, isToday = false } = $props();

  const PHASE_LABEL = {
    cyprus: 'Cyprus', cortina: 'Cortina', huts: 'Hut trek',
    gardena: 'Val Gardena', garda: 'Lake Garda', venice: 'Venice'
  };

  let dateLabel = $derived(
    new Date(day.date + 'T12:00:00').toLocaleDateString('en-GB',
      { weekday: 'short', day: 'numeric', month: 'short' })
  );
  let acts = $derived(day.activities ?? []);
</script>

<section class="day" class:today={isToday} id={'day-' + day.date}>
  <header>
    <span class="date mono">{dateLabel}</span>
    {#if isToday}<span class="pill hot">Today</span>{/if}
    {#if day.phase && PHASE_LABEL[day.phase]}
      <span class="phase mono">{PHASE_LABEL[day.phase]}</span>
    {/if}
    {#if day.holiday}<span class="pill warn">{day.holiday}</span>{/if}
  </header>

  {#if day.title}<h3>{day.title}</h3>{/if}
  {#if day.base_location}
    <div class="base mono">sleeping · {day.base_location}</div>
  {/if}

  {#if acts.length}
    <div class="acts">
      {#each acts as a (a.id)}
        <ActivityCard activity={a} />
      {/each}
    </div>
  {:else}
    <p class="empty">Nothing planned yet.</p>
  {/if}

  {#if app.editing}
    <button class="btn ghost sm add">+ Add activity</button>
  {/if}
</section>

<style>
  .day {
    background: var(--paper); border: 1px solid var(--line);
    border-radius: var(--radius); padding: 15px 16px; margin-bottom: 12px;
  }
  .day.today { border-color: var(--glow); box-shadow: 0 0 0 2px var(--glow-soft); }
  header { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-bottom: 5px; }
  .date { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--rock-soft); }
  .phase { font-size: 10.5px; color: var(--pine); }
  .base { font-size: 11.5px; color: var(--rock-soft); margin: 3px 0 10px; }
  .acts { display: flex; flex-direction: column; gap: 8px; }
  .empty { font-size: 13px; color: var(--rock-soft); padding: 6px 0; }
  .add { margin-top: 10px; }
</style>
