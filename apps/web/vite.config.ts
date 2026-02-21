import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), enhancedImages(), sveltekit()],
  ssr: {
    noExternal: ['@nota/ui', 'svelte-sonner', 'bits-ui', 'svelte-toolbelt', 'mode-watcher', 'runed'],
  },
  server: {
    host: '127.0.0.1',
  },
  build: {
    sourcemap: false,
  },
});
