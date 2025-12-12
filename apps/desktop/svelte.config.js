// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({ script: true }),
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "index.html",
      precompress: true,
      strict: false,
    }),
  },
  compilerOptions: {
    css: "injected",
  },
  alias: {
    "@lib": "../../packages/ui/src/lib",
    "@lib/*": "../../packages/ui/src/lib/*",
    "$lib/*": "./src/lib/*",
  },
};

export default config;
