<script>
  import { app, setWho } from './state.svelte.js';
  import { unlockEditing, lockEditing } from './supabase.js';
  import { PEOPLE } from './config.js';

  let dialog = $state(null);
  let password = $state('');
  let who = $state('');
  let error = $state('');
  let busy = $state(false);

  function open() {
    password = ''; error = '';
    who = app.who ?? '';
    dialog.showModal();
  }

  async function submit(e) {
    e.preventDefault();
    if (!password || busy) return;
    if (!who.trim()) { error = 'Pick who you are, so changes show who made them.'; return; }
    busy = true; error = '';
    const res = await unlockEditing(password);
    busy = false;
    password = '';
    if (res.ok) {
      setWho(who);              // remembered on this device
      app.editing = true;
      dialog.close();
    } else {
      error = res.message;
    }
  }

  async function done() {
    // Locking signs out, so the session is genuinely gone rather than the
    // buttons merely being hidden.
    await lockEditing();
    app.editing = false;
  }

  function click() {
    if (app.canEdit && app.editing) done();
    else if (app.canEdit) app.editing = true;   // session still valid, just re-arm
    else open();
  }
</script>

<button
  class="edit-btn"
  class:on={app.editing}
  onclick={click}
  title={app.editing ? 'Editing is on — click to lock' : 'Unlock editing with the group password'}
>
  {#if app.editing}
    <span aria-hidden="true">✓</span> Editing · Done
  {:else}
    <span aria-hidden="true">🔒</span> Edit
  {/if}
</button>

<dialog bind:this={dialog}>
  <form class="modal-in" onsubmit={submit}>
    <h3>Unlock editing</h3>
    <p class="muted" style="font-size:13.5px;margin:6px 0 14px">
      Everyone can read the trip. Changing it needs the group password.
    </p>
    <div class="field">
      <span class="lbl">Who are you?</span>
      <div class="who-row">
        {#each PEOPLE as p}
          <button type="button" class="who-chip" class:on={who === p} onclick={() => who = p}>{p}</button>
        {/each}
        <input class="who-other" bind:value={who} maxlength="40" placeholder="or type a name" />
      </div>
    </div>
    <div class="field">
      <label for="pw">Group password</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input id="pw" type="password" bind:value={password} autocomplete="current-password" autofocus />
    </div>
    {#if error}<div class="error">{error}</div>{/if}
    <div class="modal-actions">
      <button type="button" class="btn ghost" onclick={() => dialog.close()}>Cancel</button>
      <button type="submit" class="btn" disabled={busy || !password}>
        {busy ? 'Checking…' : 'Unlock'}
      </button>
    </div>
  </form>
</dialog>

<style>
  .edit-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff; color: var(--pine); border: 1px solid var(--line);
    border-radius: 99px; padding: 6px 14px; font-size: 13px; font-weight: 500;
  }
  .edit-btn:hover { background: var(--ice); }
  .edit-btn.on { background: var(--pine); color: #fff; border-color: var(--pine); }
  .edit-btn.on:hover { background: var(--pine-deep); }
  .edit-btn:focus-visible { outline: 2px solid var(--dusk); outline-offset: 2px; }

  .lbl { display: block; font-size: 12px; font-weight: 600; color: var(--rock-soft); margin-bottom: 6px; }
  .who-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .who-chip {
    background: #fff; border: 1px solid var(--line); border-radius: 99px;
    padding: 5px 13px; font-size: 13px; color: var(--rock);
  }
  .who-chip:hover { background: var(--ice); }
  .who-chip.on { background: var(--pine); color: #fff; border-color: var(--pine); }
  .who-other { flex: 1 1 130px; border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; }
</style>
