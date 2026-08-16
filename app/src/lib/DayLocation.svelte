<script>
  import { geocode } from './geo.js';
  import { saveDay } from './actions.svelte.js';
  import { t } from './i18n.svelte.js';

  let { day } = $props();

  let open = $state(false);
  let busy = $state(false);
  let error = $state('');
  let candidates = $state([]);
  let query = $state('');

  let placed = $derived(day.lat != null && day.lon != null);

  async function look() {
    busy = true; error = ''; candidates = [];
    try {
      const results = await geocode(query || day.base_location || day.title || '');
      candidates = results;
      if (!results.length) error = t('loc.none');
    } catch (e) {
      console.error('geocode failed', e);
      error = e.message;
    } finally { busy = false; }
  }

  async function choose(c) {
    busy = true; error = '';
    try {
      await saveDay(day.id, { lat: c.lat, lon: c.lon });
      candidates = [];
      open = false;
    } catch (e) { error = e.message; } finally { busy = false; }
  }

  async function clear() {
    busy = true;
    try { await saveDay(day.id, { lat: null, lon: null }); } finally { busy = false; }
  }
</script>

<div class="loc">
  <button class="linkish" onclick={() => { open = !open; query = day.base_location ?? ''; }}>
    {placed ? `📍 ${Number(day.lat).toFixed(3)}, ${Number(day.lon).toFixed(3)}` : '📍 ' + t('loc.set')}
  </button>
  {#if placed}
    <button class="linkish dim" onclick={clear} disabled={busy}>{t('loc.clear')}</button>
  {/if}

  {#if open}
    <div class="panel">
      <p class="fine">{t('loc.blurb')}</p>
      <div class="find">
        <input bind:value={query} placeholder={t('loc.placeholder')} onkeydown={(e) => e.key === 'Enter' && look()} />
        <button class="btn sm" onclick={look} disabled={busy}>{busy ? '…' : t('loc.lookup')}</button>
      </div>
      {#if error}<p class="err">{error}</p>{/if}
      {#each candidates as c}
        <button class="cand" onclick={() => choose(c)}>
          <span>{c.label}</span>
          <span class="mono">{c.lat.toFixed(3)}, {c.lon.toFixed(3)}{c.elevation != null ? ` · ${Math.round(c.elevation)} m` : ''}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .loc { display: flex; align-items: center; gap: 10px; font-size: 12.5px; margin-top: 6px; flex-wrap: wrap; }
  .dim { color: var(--rock-soft); }
  .panel {
    flex-basis: 100%; background: #fff; border: 1px solid var(--line);
    border-radius: 10px; padding: 11px 13px; margin-top: 4px;
  }
  .fine { font-size: 12px; color: var(--rock-soft); margin-bottom: 8px; }
  .find { display: flex; gap: 6px; }
  .find input { flex: 1; border: 1px solid var(--line); border-radius: 8px; padding: 6px 9px; }
  .cand {
    display: flex; justify-content: space-between; gap: 10px; width: 100%;
    text-align: start; background: none; border: none; border-top: 1px solid var(--line);
    padding: 7px 0; font-size: 12.5px; color: var(--rock);
  }
  .cand:hover { color: var(--pine); }
  .cand .mono { color: var(--rock-soft); font-size: 11px; white-space: nowrap; }
  .err { font-size: 12px; color: #A03A55; margin-top: 6px; }
</style>
