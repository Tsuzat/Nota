import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "../../apps/app/src-tauri/migrations",
  dialect: "sqlite",
});
