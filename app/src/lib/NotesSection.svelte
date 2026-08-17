<script>
  import { app } from './state.svelte.js';
  import { addNote, removeNote } from './actions.svelte.js';
  import { t, locale } from './i18n.svelte.js';

  let body = $state('');
  let busy = $state(false);
  let error = $state('');

  let notes = $derived([...(app.bundle?.notes ?? [])]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))));

  /** Which day or activity a note is pinned to, if any. */
  function context(n) {
    if (n.activity_id) {
      for (const d of app.bundle?.days ?? []) {
        const a = (d.activities ?? []).find(x => x.id === n.activity_id);
        if (a) return a.title;
      }
      const u = (app.bundle?.unscheduled ?? []).find(x => x.id === n.activity_id);
      if (u) return u.title;
    }
    if (n.day_id) {
      const d = (app.bundle?.days ?? []).find(x => x.id === n.day_id);
      if (d) return d.title ?? d.date;
    }
    return null;
  }

  function when(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return t('notes.justNow');
    if (mins < 60) return t('notes.minsAgo', { n: mins });
    if (mins < 1440) return t('notes.hoursAgo', { n: Math.round(mins / 60) });
    return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) + ' ' +
           d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  }

  async function post(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    busy = true; error = '';
    try { await addNote(text); body = ''; }
    catch (err) { console.error('could not post note', err); error = err.message; }
    finally { busy = false; }
  }
</script>

<section>
  <h2>{t('notes.title')}</h2>
  <p class="sub">{t('notes.blurb')}</p>

  {#if app.editing}
    <form onsubmit={post}>
      <textarea bind:value={body} rows="3" maxlength="2000" placeholder={t('notes.placeholder')}></textarea>
      <div class="actions">
        <button class="btn" type="submit" disabled={busy || !body.trim()}>
          {busy ? t('notes.posting') : t('notes.post')}
        </button>
      </div>
    </form>
  {:else}
    <p class="hint">{t('notes.lockedHint')}</p>
  {/if}

  {#if error}<p class="err">{error}</p>{/if}

  <div class="list">
    {#each notes as n (n.id)}
      <article class="note">
        <div class="head">
          <span class="who">{n.author}</span>
          <span class="when mono">{when(n.created_at)}</span>
          {#if context(n)}<span class="ctx">· {context(n)}</span>{/if}
          {#if app.editing}
            <button class="linkish danger" onclick={() => removeNote(n.id)}>{t('notes.delete')}</button>
          {/if}
        </div>
        <div class="body">{n.body}</div>
      </article>
    {/each}
    {#if !notes.length}<p class="empty">{t('notes.empty')}</p>{/if}
  </div>
</section>

<style>
  .sub { color: var(--rock-soft); margin: 4px 0 14px; font-size: 13.5px; max-width: 620px; }
  textarea { width: 100%; border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; font-size: 14px; line-height: 1.6; resize: vertical; background: #fff; }
  .actions { display: flex; justify-content: flex-end; margin-top: 8px; }
  .hint { font-size: 13px; color: var(--rock-soft); }
  .list { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
  .note { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 15px; }
  .head { display: flex; align-items: center; gap: 9px; margin-bottom: 5px; flex-wrap: wrap; }
  .who { font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; background: var(--dusk-soft); color: #33566F; padding: 2px 8px; border-radius: 99px; }
  .when { font-size: 11px; color: var(--rock-soft); }
  .ctx { font-size: 11.5px; color: var(--pine); }
  .danger { margin-inline-start: auto; color: var(--glow); font-size: 12px; }
  .body { font-size: 14px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
  .empty { color: var(--rock-soft); font-size: 13.5px; padding: 12px 0; }
  .err { color: #A03A55; font-size: 13px; margin-top: 8px; }
</style>
