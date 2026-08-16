<script>
  import { i18n, setLocale } from './i18n.svelte.js';
</script>

<div class="lang" role="group" aria-label="Language">
  <button class:on={i18n.locale === 'en'} onclick={() => setLocale('en')} lang="en">EN</button>
  <button class:on={i18n.locale === 'he'} onclick={() => setLocale('he')} lang="he">עברית</button>
</div>

<style>
  .lang { display: inline-flex; border: 1px solid rgba(255,255,255,.3); border-radius: 99px; overflow: hidden; }
  .lang button {
    background: transparent; border: none; color: #BFD4CC;
    font-size: 12px; padding: 4px 10px; line-height: 1.6;
  }
  .lang button:hover { color: #fff; }
  .lang button.on { background: rgba(255,255,255,.16); color: #fff; }
  .lang button:focus-visible { outline: 2px solid var(--dusk); outline-offset: -2px; }
</style>
