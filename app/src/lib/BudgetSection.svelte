<script>
  import { app } from './state.svelte.js';
  import { saveBudget, addBudgetItem, removeBudgetItem } from './actions.svelte.js';
  import { t, fmtNumber } from './i18n.svelte.js';

  let rows = $derived([...(app.bundle?.budget ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
  let est = $derived(rows.reduce((s, r) => s + Number(r.est_amount ?? 0), 0));
  let actual = $derived(rows.reduce((s, r) => s + Number(r.actual_amount ?? 0), 0));
  let anyActual = $derived(rows.some(r => r.actual_amount != null));
  let error = $state('');

  /** Empty means unknown, not zero — an empty "spent" box is not €0 spent. */
  const num = (v) => (v === '' || v == null ? null : Number(v));

  async function edit(row, field, value) {
    error = '';
    try { await saveBudget(row.id, { [field]: field.endsWith('amount') ? num(value) : value }); }
    catch (e) { error = e.message; }
  }
</script>

<section>
  <h2>{t('budget.title')}</h2>
  <p class="sub">{t('budget.blurb')}</p>

  <table>
    <thead>
      <tr>
        <th>{t('budget.item')}</th>
        <th class="num">{t('budget.est')}</th>
        <th class="num">{t('budget.actual')}</th>
        <th>{t('budget.note')}</th>
        {#if app.editing}<th></th>{/if}
      </tr>
    </thead>
    <tbody>
      {#each rows as r (r.id)}
        <tr>
          <td>
            {#if app.editing}
              <input class="cell" value={r.label} onchange={(e) => edit(r, 'label', e.currentTarget.value)} />
            {:else}{r.label}{/if}
          </td>
          <td class="num">
            {#if app.editing}
              <input class="cell num" type="number" min="0" step="1" value={r.est_amount ?? ''}
                     onchange={(e) => edit(r, 'est_amount', e.currentTarget.value)} />
            {:else}{r.est_amount != null ? '€' + fmtNumber(r.est_amount) : '—'}{/if}
          </td>
          <td class="num">
            {#if app.editing}
              <input class="cell num" type="number" min="0" step="1" value={r.actual_amount ?? ''}
                     onchange={(e) => edit(r, 'actual_amount', e.currentTarget.value)} />
            {:else}{r.actual_amount != null ? '€' + fmtNumber(r.actual_amount) : '—'}{/if}
          </td>
          <td class="note">
            {#if app.editing}
              <input class="cell" value={r.note ?? ''} onchange={(e) => edit(r, 'note', e.currentTarget.value)} />
            {:else}{r.note ?? ''}{/if}
          </td>
          {#if app.editing}
            <td><button class="linkish danger" onclick={() => removeBudgetItem(r.id)}>×</button></td>
          {/if}
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr>
        <td>{t('budget.totalPP')}</td>
        <td class="num">€{fmtNumber(est)}</td>
        <td class="num">{anyActual ? '€' + fmtNumber(actual) : '—'}</td>
        <td colspan={app.editing ? 2 : 1}></td>
      </tr>
      <tr>
        <td>{t('budget.totalGroup', { n: app.bundle?.people?.length || 3 })}</td>
        <td class="num">€{fmtNumber(est * (app.bundle?.people?.length || 3))}</td>
        <td class="num"></td>
        <td colspan={app.editing ? 2 : 1}></td>
      </tr>
    </tfoot>
  </table>

  {#if error}<p class="err">{error}</p>{/if}
  {#if app.editing}
    <button class="btn ghost sm" onclick={addBudgetItem}>{t('budget.add')}</button>
  {/if}
</section>

<style>
  .sub { color: var(--rock-soft); margin: 4px 0 16px; font-size: 13.5px; max-width: 620px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
  th, td { padding: 9px 12px; text-align: start; border-bottom: 1px solid var(--line); font-size: 13.5px; }
  th { background: var(--ice); font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; color: var(--rock-soft); }
  td.num, th.num { text-align: end; font-family: var(--font-mono); white-space: nowrap; }
  tfoot td { font-weight: 600; background: var(--ice); font-family: var(--font-mono); }
  .cell { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 4px 6px; background: transparent; }
  .cell:hover, .cell:focus { border-color: var(--line); background: #fff; outline: none; }
  .cell.num { text-align: end; font-family: var(--font-mono); }
  .note { color: var(--rock-soft); font-size: 12.5px; }
  .danger { color: var(--glow); }
  .err { color: #A03A55; font-size: 13px; margin-top: 8px; }
  button.btn { margin-top: 12px; }
</style>
