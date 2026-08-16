<script>
  import { app, days, today, daysUntilStart, trip } from './state.svelte.js';

  /**
   * The numbers worth knowing at a glance. Everything is derived from data
   * already loaded — nothing here fetches, so it works offline too.
   *
   * Distances and ascent are summed only over activities that actually carry a
   * figure. The seeded trip has none yet, so those tiles say "not filled in"
   * rather than a confident 0 km, which would read as a flat trip.
   */
  let all = $derived(days());
  let acts = $derived(all.flatMap(d => d.activities ?? []));
  let unscheduled = $derived(app.bundle?.unscheduled ?? []);

  let withDistance = $derived(acts.filter(a => a.distance_km != null));
  let withAscent = $derived(acts.filter(a => a.ascent_m != null));
  let km = $derived(withDistance.reduce((s, a) => s + Number(a.distance_km), 0));
  let up = $derived(withAscent.reduce((s, a) => s + Number(a.ascent_m), 0));

  let allBookings = $derived([...acts, ...unscheduled].filter(a => a.booking?.needed));
  let booked = $derived(allBookings.filter(a => a.booking?.status === 'done'));

  let budget = $derived(app.bundle?.budget ?? []);
  let est = $derived(budget.reduce((s, b) => s + Number(b.est_amount ?? 0), 0));
  let actual = $derived(budget.reduce((s, b) => s + Number(b.actual_amount ?? 0), 0));
  let anyActual = $derived(budget.some(b => b.actual_amount != null));

  let emptyDays = $derived(all.filter(d => !(d.activities ?? []).length).length);
  let located = $derived(all.filter(d => d.lat != null && d.lon != null).length);
  let photos = $derived((app.bundle?.files ?? []).filter(f => f.kind === 'photo').length);

  let countdown = $derived(daysUntilStart());
  let todayRow = $derived(today());
</script>

<section class="dash">
  <h2>Dashboard</h2>

  <div class="tiles">
    <div class="tile">
      <span class="n">{all.length}</span>
      <span class="l">days</span>
      <span class="s">{emptyDays ? `${emptyDays} with nothing planned` : 'all have something planned'}</span>
    </div>

    <div class="tile">
      <span class="n">{booked.length}<span class="of">/{allBookings.length}</span></span>
      <span class="l">booked</span>
      <span class="s" class:warn={booked.length < allBookings.length}>
        {allBookings.length - booked.length} still outstanding
      </span>
    </div>

    <div class="tile">
      {#if withDistance.length}
        <span class="n">{km.toFixed(0)}<span class="of">km</span></span>
        <span class="l">on foot</span>
        <span class="s">from {withDistance.length} of {acts.length} activities</span>
      {:else}
        <span class="n dim">—</span>
        <span class="l">on foot</span>
        <span class="s">no distances filled in yet</span>
      {/if}
    </div>

    <div class="tile">
      {#if withAscent.length}
        <span class="n">{up.toLocaleString()}<span class="of">m</span></span>
        <span class="l">ascent</span>
        <span class="s">from {withAscent.length} of {acts.length} activities</span>
      {:else}
        <span class="n dim">—</span>
        <span class="l">ascent</span>
        <span class="s">no ascent filled in yet</span>
      {/if}
    </div>

    <div class="tile">
      <span class="n">€{est.toLocaleString()}</span>
      <span class="l">budget pp</span>
      <span class="s">
        {#if anyActual}spent €{actual.toLocaleString()} so far{:else}nothing recorded as spent{/if}
      </span>
    </div>

    <div class="tile">
      <span class="n">{located}<span class="of">/{all.length}</span></span>
      <span class="l">on the map</span>
      <span class="s">{photos} photo{photos === 1 ? '' : 's'} uploaded</span>
    </div>
  </div>

  {#if countdown !== null && countdown > 0}
    <p class="line">
      <b>{countdown}</b> days until {trip.current?.title}. {unscheduled.length} thing{unscheduled.length === 1 ? '' : 's'} still to schedule.
    </p>
  {:else if todayRow}
    <p class="line live"><b>Today:</b> {todayRow.title ?? 'nothing planned'}</p>
  {/if}
</section>

<style>
  .dash { margin-top: 30px; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 12px; }
  .tile {
    background: #fff; border: 1px solid var(--line); border-radius: var(--radius);
    padding: 14px 16px; display: flex; flex-direction: column; gap: 1px;
  }
  .n { font-family: var(--font-display); font-size: 27px; font-weight: 600; color: var(--pine); line-height: 1.1; }
  .n.dim { color: var(--line); }
  .of { font-size: 15px; color: var(--rock-soft); margin-inline-start: 2px; }
  .l { font-size: 12.5px; font-weight: 500; }
  .s { font-size: 11.5px; color: var(--rock-soft); margin-top: 3px; }
  .s.warn { color: var(--glow); }
  .line { margin-top: 14px; font-size: 13.5px; color: var(--rock-soft); }
  .line b { color: var(--glow); font-size: 15px; }
  .line.live b { color: var(--pine); }
</style>
