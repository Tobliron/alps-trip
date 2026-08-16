<script>
  import { onMount } from 'svelte';
  import { app, trip, days, today, daysUntilStart, boot, loadTrip } from './lib/state.svelte.js';
  import { APP_NAME } from './lib/config.js';
  import { t, fmtDate, applyDirection } from './lib/i18n.svelte.js';
  import LangToggle from './lib/LangToggle.svelte';
  import EditButton from './lib/EditButton.svelte';
  import DayCard from './lib/DayCard.svelte';
  import Backlog from './lib/Backlog.svelte';
  import ActivityEditor from './lib/ActivityEditor.svelte';
  import DataPanel from './lib/DataPanel.svelte';
  import TripMap from './lib/TripMap.svelte';
  import Dashboard from './lib/Dashboard.svelte';

  let editor = $state(null);
  const openEditor = (activity) => editor?.open(activity);

  onMount(() => { applyDirection(); boot(); });

  let todayRow = $derived(today());
  let countdown = $derived(daysUntilStart());

  function goToday() {
    document.getElementById('day-' + todayRow.date)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<header class="top">
  <div class="inner">
    <div class="brand">
      <span class="name">{APP_NAME}</span>
      <span class="tagline mono">{t('app.tagline')}</span>
    </div>

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
          {#each app.trips as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
        </select>
      {:else}
        <h1>{trip.current.title}</h1>
      {/if}
      {#if trip.current.subtitle}
        <div class="sub mono">{trip.current.subtitle}</div>
      {/if}
    </div>
  {/if}
</header>

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

  {:else}
    {#if countdown !== null && countdown > 0}
      <!-- @html is safe here and only here: the only interpolated value is
           Number(countdown), a computed integer, never anything user-typed. -->
      <div class="countdown">
        {@html t(countdown === 1 ? 'app.countdown.one' : 'app.countdown',
                 { n: `<b>${Number(countdown)}</b>` })}
      </div>
    {:else if todayRow}
      <!-- A summary, not a second DayCard: rendering the same day twice would
           put two drag zones over the same activity ids and break both the
           keyed list and drag-and-drop. -->
      <div class="countdown live">
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
        <button class="linkish" onclick={goToday}>{t('app.today.open')}</button>
      </div>
    {/if}

    {#each days() as d (d.id)}
      <DayCard day={d} isToday={todayRow?.id === d.id} onedit={openEditor} />
    {/each}

    <Backlog onedit={openEditor} />
    <Dashboard />
    <TripMap />
    <DataPanel />
  {/if}
</main>

<ActivityEditor bind:this={editor} />

<style>
  .top { background: var(--pine-deep); color: var(--ice); padding: 14px 16px 18px; }
  .inner { max-width: 1060px; margin-inline: auto; }
  .inner:first-child { display: flex; align-items: center; gap: 12px; }
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

  .countdown {
    background: var(--glow-soft); border: 1px solid #E8B9C6;
    border-radius: var(--radius); padding: 12px 16px; margin-bottom: 18px; font-size: 14px;
  }
  .countdown b { color: var(--glow); font-size: 17px; }
  .countdown.live { background: #E2EDE8; border-color: #BBD2C8; }
  .countdown.live b { color: var(--pine); }
  .countdown .linkish { margin-inline-start: 0; font-size: 13px; margin-top: 6px; display: inline-block; }
  .sleep { font-size: 11.5px; color: var(--rock-soft); margin-top: 4px; }
  .today-list { margin: 8px 0 0 18px; font-size: 13.5px; }
  .today-list li { margin-bottom: 2px; }

  .backlog-title { margin-top: 26px; }
  code { font-family: var(--font-mono); font-size: 12px; background: var(--ice); padding: 1px 5px; border-radius: 4px; }
</style>
