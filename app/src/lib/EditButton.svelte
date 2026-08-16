<script>
  import { app } from './state.svelte.js';
  import { unlockEditing, lockEditing } from './supabase.js';

  let dialog = $state(null);
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  function open() {
    password = ''; error = '';
    dialog.showModal();
  }

  async function submit(e) {
    e.preventDefault();
    if (!password || busy) return;
    busy = true; error = '';
    const res = await unlockEditing(password);
    busy = false;
    password = '';
    if (res.ok) {
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
</style>
