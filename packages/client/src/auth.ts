import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  baseURL: PUBLIC_BACKEND_URL,
});
