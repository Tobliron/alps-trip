<script>
  import { app, days, trip, today } from './state.svelte.js';
  import { goTab } from './ui.svelte.js';
  import { t, locale, fmtDate } from './i18n.svelte.js';

  let byDate = $derived(new Map(days().map(d => [d.date, d])));
  let todayISO = $derived(new Date().toISOString().slice(0, 10));

  /** Months to draw, taken from the trip's own span rather than hardcoded. */
  let months = $derived.by(() => {
    const s = trip.current?.start_date, e = trip.current?.end_date;
    if (!s || !e) return [];
    const out = [];
    const cur = new Date(s + 'T12:00:00');
    cur.setDate(1);
    const end = new Date(e + 'T12:00:00');
    while (cur <= end) {
      out.push({ y: cur.getFullYear(), m: cur.getMonth() });
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  });

  /** Weekday names in the current language, Monday first. */
  let dow = $derived.by(() => {
    const out = [];
    // 2024-01-01 was a Monday; any known Monday works as the anchor.
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(2024, 0, 1 + i));
      out.push(d.toLocaleDateString(locale(), { weekday: 'short' }));
    }
    return out;
  });

  function cells(y, m) {
    const first = new Date(y, m, 1);
    const pad = (first.getDay() + 6) % 7;          // shift Sunday=0 to Monday-first
    const len = new Date(y, m + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < pad; i++) out.push(null);
    for (let d = 1; d <= len; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      out.push({ n: d, iso, day: byDate.get(iso) ?? null });
    }
    return out;
  }

  const KIND_CLASS = {
    hike: 'k-hike', flight: 'k-flight', plan: 'k-plan', holiday: 'k-holiday',
    booking: 'k-booking', drive: 'k-plan', food: 'k-plan', rest: 'k-holiday', custom: 'k-custom'
  };

  function open(cell) {
    if (!cell?.day) return;
    goTab('days', 'day-' + cell.iso);
  }
</script>

<section>
  <h2>{t('cal.title')}</h2>
  <p class="sub">{t('cal.blurb')}</p>

  <div class="legend">
    <span><i class="k-hike"></i>{t('kind.hike')}</span>
    <span><i class="k-flight"></i>{t('kind.flight')}</span>
    <span><i class="k-plan"></i>{t('kind.plan')}</span>
    <span><i class="k-holiday"></i>{t('kind.holiday')}</span>
    <span><i class="k-booking"></i>{t('kind.booking')}</span>
  </div>

  {#each months as mo (mo.y + '-' + mo.m)}
    <div class="month">
      <h3>{new Date(mo.y, mo.m, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}</h3>
      <div class="grid">
        {#each dow as d}<div class="dow">{d}</div>{/each}
        {#each cells(mo.y, mo.m) as c, i (i)}
          {#if !c}
            <div class="cell out"></div>
          {:else}
            <div class="cell" class:trip={!!c.day} class:today={c.iso === todayISO}>
              <div class="num mono">{c.n}</div>
              {#if c.day}
                <button class="open" onclick={() => open(c)} title={c.day.title ?? ''}>
                  {#if c.day.holiday}<span class="hol">{c.day.holiday}</span>{/if}
                  {#each (c.day.activities ?? []) as a (a.id)}
                    <span class="ev {KIND_CLASS[a.kind] ?? 'k-custom'}">{a.title}</span>
                  {/each}
                  {#if !(c.day.activities ?? []).length}
                    <span class="ev k-empty">{t('cal.nothing')}</span>
                  {/if}
                </button>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</section>

<style>
  .sub { color: var(--rock-soft); margin: 4px 0 12px; font-size: 13.5px; max-width: 620px; }
  .legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--rock-soft); margin-bottom: 18px; }
  .legend span { display: flex; align-items: center; gap: 5px; }
  .legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .month { margin-bottom: 26px; }
  .month h3 { font-size: 19px; margin-bottom: 10px; }
  /* minmax(0, 1fr), not 1fr: a bare 1fr will not shrink below its content's
     minimum width, so one long activity title pushes the whole seven-column
     grid wider than the page and Sunday falls off the edge. */
  .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
  .dow {
    font-family: var(--font-mono); font-size: 10px; text-transform: uppercase;
    letter-spacing: .1em; color: var(--rock-soft); text-align: center; padding: 4px 0;
  }
  .cell {
    background: #fff; border: 1px solid var(--line); border-radius: 8px;
    min-height: 92px; padding: 4px 5px; font-size: 11.5px;
  }
  .cell.out { background: transparent; border-color: transparent; min-height: 0; }
  .cell.trip { border-color: #C8D6CF; }
  .num { font-size: 11px; color: var(--rock-soft); }
  .cell.today .num { background: var(--pine); color: #fff; border-radius: 5px; padding: 0 4px; display: inline-block; }
  .open {
    display: flex; flex-direction: column; gap: 3px; width: 100%;
    background: none; border: none; padding: 3px 0 0; text-align: start; cursor: pointer;
  }
  .ev {
    border-radius: 5px; padding: 2px 5px; line-height: 1.25;
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow-wrap: anywhere;    /* long titles wrap instead of widening the cell */
    /* an English title inside a Hebrew layout keeps its own direction */
    unicode-bidi: plaintext;
  }
  .open { min-width: 0; }
  .cell { min-width: 0; }
  .hol {
    font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .06em;
    background: var(--glow-soft); color: #A03A55; border-radius: 5px; padding: 1px 5px;
  }
  .k-hike { background: #E2EDE8; color: var(--pine-deep); }
  .k-flight { background: var(--dusk-soft); color: #33566F; }
  .k-plan { background: var(--gold-soft); color: #8A6620; }
  .k-holiday { background: var(--glow-soft); color: #A03A55; }
  .k-booking { background: #F0E6F3; color: #6B4478; }
  .k-custom { background: var(--ice); color: var(--rock); border: 1px dashed var(--rock-soft); }
  .k-empty { color: var(--rock-soft); font-style: italic; }
  .legend .k-hike { background: var(--pine); }
  .legend .k-flight { background: var(--dusk); }
  .legend .k-plan { background: var(--gold); }
  .legend .k-holiday { background: var(--glow); }
  .legend .k-booking { background: #6B4478; }
  @media (max-width: 640px) {
    .cell { min-height: 62px; font-size: 10px; }
    .ev { -webkit-line-clamp: 1; }
  }
</style>
