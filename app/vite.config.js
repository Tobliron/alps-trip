import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// GitHub Pages serves this repo at https://tobliron.github.io/alps-trip/,
// so every asset URL has to be prefixed with that path. Without `base` the
// built page asks for /assets/... at the domain root and renders blank.
export default defineConfig({
  base: '/alps-trip/',
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
