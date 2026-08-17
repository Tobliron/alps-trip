<script>
  import { search, goTab } from './ui.svelte.js';
  import { t } from './i18n.svelte.js';

  let q = $state('');
  let open = $state(false);
  let active = $state(0);
  let box = $state(null);

  let results = $derived(search(q));

  const ICON = { day: '📅', activity: '📍', booking: '🎫', note: '📝', budget: '€', packing: '🎒' };

  function choose(r) {
    goTab(r.tab, r.anchor);
    q = ''; open = false; active = 0;
  }

  function keydown(e) {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % results.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + results.length) % results.length; }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Escape') { open = false; }
  }

  // Clicking away closes the list; without this it hangs around over the page.
  function onDocClick(e) {
    if (box && !box.contains(e.target)) open = false;
  }
  $effect(() => {
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  });
</script>

<div class="search" bind:this={box}>
  <input
    type="search"
    bind:value={q}
    placeholder={t('search.placeholder')}
    aria-label={t('search.placeholder')}
    onfocus={() => open = true}
    oninput={() => { open = true; active = 0; }}
    onkeydown={keydown}
  />

  {#if open && q.trim().length >= 2}
    <div class="results" role="listbox">
      {#if results.length}
        {#each results as r, i (r.kind + r.label + i)}
          <button
            class="hit" class:on={i === active} role="option" aria-selected={i === active}
            onclick={() => choose(r)} onmouseenter={() => active = i}
          >
            <span class="ic" aria-hidden="true">{ICON[r.kind] ?? '•'}</span>
            <span class="lbl">{r.label}</span>
            {#if r.sub}<span class="sub mono">{r.sub}</span>{/if}
          </button>
        {/each}
      {:else}
        <p class="none">{t('search.none', { q })}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search { position: relative; flex: 1 1 200px; max-width: 340px; }
  input {
    width: 100%; border-radius: 99px; border: 1px solid rgba(255,255,255,.28);
    background: rgba(255,255,255,.12); color: var(--ice);
    padding: 6px 14px; font-size: 13px;
  }
  input::placeholder { color: #9FC0B5; }
  input:focus { outline: none; border-color: rgba(255,255,255,.6); background: rgba(255,255,255,.18); }
  .results {
    position: absolute; inset-inline-start: 0; inset-inline-end: 0; top: calc(100% + 6px);
    background: #fff; border: 1px solid var(--line); border-radius: 12px;
    box-shadow: 0 16px 40px rgba(30,40,35,.22);
    max-height: 60vh; overflow-y: auto; z-index: 60; padding: 5px;
  }
  .hit {
    display: flex; align-items: center; gap: 9px; width: 100%;
    background: none; border: none; border-radius: 8px;
    padding: 8px 10px; text-align: start; font-size: 13.5px; color: var(--rock);
  }
  .hit.on { background: var(--ice); }
  .ic { width: 18px; flex-shrink: 0; text-align: center; }
  .lbl { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sub { font-size: 11px; color: var(--rock-soft); flex-shrink: 0; }
  .none { padding: 12px; font-size: 13px; color: var(--rock-soft); }
</style>
