<script>
  import { app } from './state.svelte.js';
  import { fetchChangeLog } from './data.js';
  import { t, locale } from './i18n.svelte.js';

  let rows = $state([]);
  let loading = $state(true);
  let error = $state('');

  // Fetched on demand rather than with the trip bundle: the log only grows,
  // and nothing else on the page needs it.
  $effect(() => {
    const id = app.tripId;
    if (!id) return;
    loading = true; error = '';
    fetchChangeLog(id)
      .then(r => { rows = r; })
      .catch(e => { console.error('could not load the change log', e); error = e.message; })
      .finally(() => { loading = false; });
  });

  function when(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) + ' ' +
           d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  }
</script>

<section>
  <h2>{t('log.title')}</h2>
  <p class="sub">{t('log.blurb')}</p>

  {#if loading}
    <p class="empty">{t('app.loading')}</p>
  {:else if error}
    <p class="err">{error}</p>
  {:else if !rows.length}
    <p class="empty">{t('log.empty')}</p>
  {:else}
    <ul class="log">
      {#each rows as r (r.id)}
        <li>
          <span class="who">{r.author}</span>
          <span class="what">{r.action}</span>
          <span class="when mono">{when(r.created_at)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .sub { color: var(--rock-soft); margin: 4px 0 14px; font-size: 13.5px; max-width: 620px; }
  .log { list-style: none; display: flex; flex-direction: column; gap: 7px; }
  .log li { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 9px 13px; display: flex; align-items: center; gap: 10px; font-size: 13.5px; flex-wrap: wrap; }
  .who { font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; background: var(--dusk-soft); color: #33566F; padding: 2px 8px; border-radius: 99px; flex-shrink: 0; }
  .what { overflow-wrap: anywhere; }
  .when { margin-inline-start: auto; font-size: 11px; color: var(--rock-soft); white-space: nowrap; }
  .empty { color: var(--rock-soft); font-size: 13.5px; padding: 12px 0; }
  .err { color: #A03A55; font-size: 13px; }
</style>
