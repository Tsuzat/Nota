import adapterCF from "@sveltejs/adapter-cloudflare";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
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
			adapter: isDesktop
				? adapter({
						pages: "build",
						assets: "build",
						fallback: "index.html",
					})
				: adapterCF(),
		}),
		visualizer({
			emitFile: true,
			filename: "stats.html",
			gzipSize: true,
			brotliSize: true,
		}),
	],
	resolve: {
		alias: {
			"$local-workspaces": isDesktop
				? "/src/lib/data/local/workspace.svelte.ts"
				: "/src/lib/data/local/workspace.stub.svelte.ts",
			"$local-notes": isDesktop
				? "/src/lib/data/local/notes.svelte.ts"
				: "/src/lib/data/local/notes.stub.svelte.ts",
		},
	},
	server: { port: 8080, allowedHosts: ["local-app.nota.ink"] },
});
