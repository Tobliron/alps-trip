<script>
  import { app } from './state.svelte.js';
  import { savePacking, addPackingItem, removePackingItem } from './actions.svelte.js';
  import { t } from './i18n.svelte.js';

  let items = $derived([...(app.bundle?.packing ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
  let groups = $derived([...new Set(items.map(i => i.group_name))]);
  let packed = $derived(items.filter(i => i.packed).length);
  let error = $state('');

  async function toggle(row, checked) {
    error = '';
    try { await savePacking(row.id, { packed: checked }); }
    catch (e) { error = e.message; }
  }
  async function rename(row, label) {
    try { await savePacking(row.id, { label }); } catch (e) { error = e.message; }
  }
</script>

<section>
  <h2>{t('pack.title')}</h2>
  <p class="sub">{t('pack.blurb')}</p>

  <div class="progress" aria-hidden="true">
    <i style="width:{items.length ? Math.round(packed / items.length * 100) : 0}%"></i>
  </div>
  <p class="count mono">{t('pack.count', { n: packed, total: items.length })}</p>

  <div class="cols">
    {#each groups as g (g)}
      <div class="group">
        <h3>{g}</h3>
        {#each items.filter(i => i.group_name === g) as i (i.id)}
          <div class="item" class:done={i.packed}>
            <input type="checkbox" id={'pk-' + i.id} checked={i.packed}
                   onchange={(e) => toggle(i, e.currentTarget.checked)} />
            {#if app.editing}
              <input class="lbl-edit" value={i.label} onchange={(e) => rename(i, e.currentTarget.value)} />
              <button class="linkish danger" onclick={() => removePackingItem(i.id)}>×</button>
            {:else}
              <label for={'pk-' + i.id}>{i.label}</label>
            {/if}
          </div>
        {/each}
        {#if app.editing}
          <button class="btn ghost sm" onclick={() => addPackingItem(g)}>{t('pack.add')}</button>
        {/if}
      </div>
    {/each}
  </div>

  {#if error}<p class="err">{error}</p>{/if}
</section>

<style>
  .sub { color: var(--rock-soft); margin: 4px 0 14px; font-size: 13.5px; max-width: 620px; }
  .progress { height: 8px; background: var(--ice); border-radius: 99px; overflow: hidden; }
  .progress i { display: block; height: 100%; background: linear-gradient(90deg, var(--pine), var(--glow)); border-radius: 99px; transition: width .3s; }
  .count { font-size: 11.5px; color: var(--rock-soft); margin: 6px 0 16px; }
  .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
  .group { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 15px 16px; }
  .group h3 { font-size: 16px; margin-bottom: 9px; }
  .item { display: flex; gap: 9px; align-items: center; padding: 3px 0; font-size: 13.5px; }
  .item input[type=checkbox] { accent-color: var(--pine); width: 16px; height: 16px; flex-shrink: 0; }
  .item.done label, .item.done .lbl-edit { text-decoration: line-through; color: var(--rock-soft); }
  .item label { cursor: pointer; }
  .lbl-edit { flex: 1; border: 1px solid transparent; border-radius: 6px; padding: 2px 5px; background: transparent; font-size: 13.5px; }
  .lbl-edit:hover, .lbl-edit:focus { border-color: var(--line); outline: none; }
  .danger { color: var(--glow); }
  .group .btn { margin-top: 9px; }
  .err { color: #A03A55; font-size: 13px; margin-top: 8px; }
</style>
