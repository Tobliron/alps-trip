<script>
  import { onMount } from 'svelte';
  import { app, trip, days, today, boot, loadTrip } from './lib/state.svelte.js';
  import { ui, goTab, TABS } from './lib/ui.svelte.js';
  import { APP_NAME } from './lib/config.js';
  import { t, fmtDate, applyDirection } from './lib/i18n.svelte.js';

  import LangToggle from './lib/LangToggle.svelte';
  import SearchBar from './lib/SearchBar.svelte';
  import EditButton from './lib/EditButton.svelte';
  import Countdown from './lib/Countdown.svelte';
  import Dashboard from './lib/Dashboard.svelte';
  import DayCard from './lib/DayCard.svelte';
  import Backlog from './lib/Backlog.svelte';
  import ActivityEditor from './lib/ActivityEditor.svelte';
  import CalendarSection from './lib/CalendarSection.svelte';
  import TripMap from './lib/TripMap.svelte';
  import BudgetSection from './lib/BudgetSection.svelte';
  import PackingSection from './lib/PackingSection.svelte';
  import NotesSection from './lib/NotesSection.svelte';
  import ActivityLog from './lib/ActivityLog.svelte';
  import DataPanel from './lib/DataPanel.svelte';

  let editor = $state(null);
  const openEditor = (activity) => editor?.open(activity);

  onMount(() => { applyDirection(); boot(); });

  let todayRow = $derived(today());
</script>

<header class="top">
  <div class="inner bar">
    <div class="brand">
      <span class="name">{APP_NAME}</span>
      <span class="tagline mono">{t('app.tagline')}</span>
    </div>
    <SearchBar />
    <div class="right">
      {#if app.offline}<span class="pill warn">{t('app.offline')}</span>{/if}
      <LangToggle />
      <EditButton />
    </div>
  </div>

  {#if trip.current}
    <div class="inner trip-line">
      {#if app.trips.length > 1}
        <select value={app.tripId} onchange={(e) => loadTrip(e.currentTarget.value)}>
          {#each app.trips as tr (tr.id)}<option value={tr.id}>{tr.title}</option>{/each}
        </select>
      {:else}
        <h1>{trip.current.title}</h1>
      {/if}
      {#if trip.current.subtitle}<div class="sub mono">{trip.current.subtitle}</div>{/if}
    </div>
  {/if}
</header>

{#if trip.current}
  <nav>
    <div class="tabs" role="tablist">
      {#each TABS as tab}
        <button class="tab" class:active={ui.tab === tab} role="tab"
                aria-selected={ui.tab === tab} onclick={() => goTab(tab)}>
          {t('tab.' + tab)}
        </button>
      {/each}
    </div>
  </nav>
{/if}

<main>
  {#if app.loading}
    <p class="muted">{t('app.loading')}</p>

  {:else if app.error}
    <div class="card">
      <h3>{t('app.error.title')}</h3>
      <p class="muted" style="margin-top:6px">{app.error}</p>
      <p class="muted" style="margin-top:10px;font-size:13px">{t('app.error.hint')}</p>
    </div>

  {:else if !app.trips.length}
    <div class="card">
      <h3>{t('app.noTrips.title')}</h3>
      <p class="muted" style="margin-top:6px">{t('app.noTrips.body')}</p>
    </div>

  {:else if ui.tab === 'overview'}
    <Countdown start={trip.current?.start_date} title={trip.current?.title} />
    {#if todayRow}
      <div class="today">
        <div>
          <b>{t('app.today')}</b> · {fmtDate(todayRow.date, { weekday: 'long', day: 'numeric', month: 'long' })}
          {#if todayRow.title} — {todayRow.title}{/if}
        </div>
        {#if todayRow.base_location}
          <div class="sleep mono">{t('app.sleeping')} · {todayRow.base_location}</div>
        {/if}
        {#if (todayRow.activities ?? []).length}
          <ul class="today-list">
            {#each todayRow.activities as a (a.id)}
              <li>{a.start_time ? a.start_time.slice(0, 5) + ' · ' : ''}{a.title}</li>
            {/each}
          </ul>
        {/if}
        <button class="linkish" onclick={() => goTab('days', 'day-' + todayRow.date)}>
          {t('app.today.open')}
        </button>
      </div>
    {/if}
    <Dashboard />

  {:else if ui.tab === 'days'}
    {#each days() as d (d.id)}
      <DayCard day={d} isToday={todayRow?.id === d.id} onedit={openEditor} />
    {/each}
    <div id="backlog"><Backlog onedit={openEditor} /></div>

  {:else if ui.tab === 'calendar'}
    <CalendarSection />

  {:else if ui.tab === 'map'}
    <TripMap />

  {:else if ui.tab === 'budget'}
    <BudgetSection />

  {:else if ui.tab === 'packing'}
    <PackingSection />

  {:else if ui.tab === 'notes'}
    <NotesSection />

  {:else if ui.tab === 'log'}
    <ActivityLog />

  {:else if ui.tab === 'backup'}
    <DataPanel />
  {/if}
</main>

<ActivityEditor bind:this={editor} />

<style>
  .top { background: var(--pine-deep); color: var(--ice); padding: 14px 16px 18px; }
  .inner { max-width: 1060px; margin-inline: auto; }
  .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .brand { display: flex; align-items: baseline; gap: 8px; }
  .name { font-family: var(--font-display); font-size: 21px; font-weight: 600; }
  .tagline { font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: #9FC0B5; }
  .right { margin-inline-start: auto; display: flex; align-items: center; gap: 10px; }
  .trip-line { margin-top: 12px; }
  .trip-line h1 { font-size: clamp(22px, 4vw, 32px); }
  .trip-line select {
    background: rgba(255,255,255,.1); color: var(--ice);
    border: 1px solid rgba(255,255,255,.25); border-radius: 8px; padding: 6px 10px;
    font-size: 17px; font-family: var(--font-display);
  }
  .sub { font-size: 11.5px; color: #BFD4CC; margin-top: 5px; }

  nav { position: sticky; top: 0; z-index: 40; background: var(--paper); border-bottom: 1px solid var(--line); }
  .tabs { max-width: 1060px; margin-inline: auto; display: flex; gap: 2px; overflow-x: auto; padding: 0 16px; }
  .tab {
    background: none; border: none; border-bottom: 3px solid transparent;
    padding: 12px 13px 10px; font-size: 13.5px; font-weight: 500;
    color: var(--rock-soft); white-space: nowrap;
  }
  .tab:hover { color: var(--rock); }
  .tab.active { color: var(--pine); border-bottom-color: var(--glow); }
  .tab:focus-visible { outline: 2px solid var(--dusk); outline-offset: -2px; }

  .today {
    background: #E2EDE8; border: 1px solid #BBD2C8;
    border-radius: var(--radius); padding: 13px 16px; margin-bottom: 18px; font-size: 14px;
  }
  .today b { color: var(--pine); }
  .sleep { font-size: 11.5px; color: var(--rock-soft); margin-top: 4px; }
  .today-list { margin: 8px 0 0 18px; font-size: 13.5px; }
  .today-list li { margin-bottom: 2px; }
  .today .linkish { margin-top: 6px; display: inline-block; font-size: 13px; }
</style>
