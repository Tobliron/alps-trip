<script>
  import { onMount } from 'svelte';
  import { t } from './i18n.svelte.js';

  let { start, title = '' } = $props();

  let now = $state(Date.now());
  let timer;

  onMount(() => {
    // One interval for the whole component. Ticking on the second boundary
    // rather than every 1000ms from mount stops the display drifting a beat.
    const tick = () => { now = Date.now(); };
    timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  });

  let target = $derived(start ? new Date(start + 'T00:00:00').getTime() : null);
  let left = $derived(target ? Math.max(0, target - now) : 0);
  let started = $derived(target != null && now >= target);

  const pad = (n) => String(n).padStart(2, '0');
  let parts = $derived({
    d: Math.floor(left / 86400000),
    h: Math.floor(left / 3600000) % 24,
    m: Math.floor(left / 60000) % 60,
    s: Math.floor(left / 1000) % 60
  });
</script>

{#if target && !started}
  <section class="cd">
    <div class="cd-label">{t('cd.until')}{title ? ' ' + title : ''}</div>
    <div class="cd-clock" aria-live="off">
      <div class="unit">
        <span class="v">{parts.d}</span>
        <span class="u">{t('cd.days')}</span>
      </div>
      <span class="sep">:</span>
      <div class="unit">
        <span class="v">{pad(parts.h)}</span>
        <span class="u">{t('cd.hours')}</span>
      </div>
      <span class="sep">:</span>
      <div class="unit">
        <span class="v">{pad(parts.m)}</span>
        <span class="u">{t('cd.minutes')}</span>
      </div>
      <span class="sep">:</span>
      <div class="unit sec">
        <span class="v">{pad(parts.s)}</span>
        <span class="u">{t('cd.seconds')}</span>
      </div>
    </div>
  </section>
{/if}

<style>
  .cd {
    background: linear-gradient(135deg, var(--pine-deep) 0%, #2b5449 55%, #3d4a52 100%);
    border-radius: var(--radius);
    padding: 20px 22px 18px;
    color: var(--ice);
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  /* a soft alpenglow wash, echoing the ridge on the legacy hero */
  .cd::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(120% 90% at 80% 0%, rgba(201,79,109,.35), transparent 60%);
    pointer-events: none;
  }
  .cd-label {
    font-family: var(--font-mono);
    font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase;
    color: #9FC0B5; margin-bottom: 12px;
  }
  .cd-clock {
    display: flex; align-items: flex-end; gap: 6px;
    /* the clock is a number, so it reads the same way in both languages */
    direction: ltr;
  }
  .unit { display: flex; flex-direction: column; align-items: center; min-width: 54px; }
  .v {
    font-family: var(--font-display);
    font-size: clamp(30px, 7vw, 46px);
    font-weight: 600; line-height: 1;
    font-variant-numeric: tabular-nums;
    /* tabular figures stop the whole row jittering as digits change */
  }
  .u {
    font-family: var(--font-mono);
    font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
    color: #9FC0B5; margin-top: 7px;
  }
  .sep {
    font-family: var(--font-display);
    font-size: clamp(24px, 5vw, 36px);
    line-height: 1; color: rgba(238,241,239,.35);
    margin-bottom: 18px;
  }
  .sec .v { color: var(--glow-soft); }
  @media (max-width: 480px) {
    .unit { min-width: 42px; }
    .cd { padding: 16px 14px 14px; }
  }
</style>
