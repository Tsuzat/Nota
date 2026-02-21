import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess({ script: true }),

  kit: {
    adapter: adapter(),
    alias: {
      '@lib': '../../packages/ui/src/lib',
      '@lib/*': '../../packages/ui/src/lib/*',
    },
    experimental: { remoteFunctions: true },
  },
  compilerOptions: { experimental: { async: true } },
};

export default config;
