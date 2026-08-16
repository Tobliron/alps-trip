<script>
  import { app } from './state.svelte.js';
  import { forecastAvailable, daysAhead, describeWeather, FORECAST_HORIZON_DAYS } from './geo.js';
  import { t, locale } from './i18n.svelte.js';

  let { day } = $props();

  /**
   * Weather is fetched once per location for the whole trip by
   * refreshWeather() in state, and parked on day.weather_cache. This component
   * only displays it.
   */
  let w = $derived(day.weather_cache?.data ?? null);
  let placed = $derived(day.lat != null && day.lon != null);
  let ahead = $derived(daysAhead(day.date));
  let inRange = $derived(forecastAvailable(day.date));
  let look = $derived(w ? describeWeather(w.code) : null);
</script>

{#if placed && w}
  <div class="wx" title={day.weather_cache?.fetched_at ? 'checked ' + new Date(day.weather_cache.fetched_at).toLocaleString('en-GB') : ''}>
    <span class="icon">{look.icon}</span>
    <span class="temp mono">{Math.round(w.min)}–{Math.round(w.max)}°C</span>
    {#if look.text}<span class="desc">{look.text}</span>{/if}
    {#if w.rain > 0}<span class="rain mono">{w.rain} mm</span>{/if}
    {#if w.wind >= 30}<span class="wind mono">wind {Math.round(w.wind)} km/h</span>{/if}
  </div>
{:else if placed && !inRange && ahead > FORECAST_HORIZON_DAYS}
  <!-- Saying "no forecast" would read as a failure. It is simply too early:
       free forecasts only reach 16 days out. -->
  <div class="wx muted">{t('wx.from', {
    date: new Date(Date.now() + (ahead - FORECAST_HORIZON_DAYS) * 86400000)
      .toLocaleDateString(locale(), { day: 'numeric', month: 'short' })
  })}</div>
{:else if !placed && app.editing}
  <div class="wx muted">{t('wx.noLocation')}</div>
{/if}

<style>
  .wx { display: flex; align-items: center; gap: 9px; font-size: 12.5px; margin: 4px 0 8px; flex-wrap: wrap; }
  .icon { font-size: 15px; }
  .temp { color: var(--rock); }
  .desc { color: var(--rock-soft); }
  .rain { color: var(--dusk); }
  .wind { color: var(--gold); }
  .muted { color: var(--rock-soft); font-size: 11.5px; }
</style>
