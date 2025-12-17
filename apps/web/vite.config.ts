import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), enhancedImages(), sveltekit()],
  ssr: {
    noExternal: ['@nota/ui', 'svelte-sonner'],
  },
  server: {
    allowedHosts: ['emerging-rabbit-solely.ngrok-free.app'],
  },
  build: {
    sourcemap: false,
  },
});
