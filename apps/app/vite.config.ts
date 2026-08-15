import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const isDesktop = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      // Consult https://svelte.dev/docs/kit/integrations
      // for more information about preprocessors
      preprocess: vitePreprocess(),

      // adapter-static emits files Electrobun and Tauri can bundle directly.
      adapter: adapter({
        pages: "build",
        assets: "build",
        fallback: "index.html",
      }),
    }),
  ],
  resolve: {
    alias: {
      "$local-workspaces": isDesktop
        ? "/src/lib/data/local/workspace.svelte.ts"
        : "/src/lib/data/local/workspace.stub.svelte.ts",
    },
  },
  server: { port: 8080 },
});
