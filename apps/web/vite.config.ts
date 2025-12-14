import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ssr: {
    noExternal: ["@nota/ui", "svelte-sonner"],
  },
  server: {
    allowedHosts: ["emerging-rabbit-solely.ngrok-free.app"],
  },
});
