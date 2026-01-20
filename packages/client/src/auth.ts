import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { isTauri } from "./request";

export const authClient = createAuthClient({
  baseURL: PUBLIC_BACKEND_URL,
  fetchOptions: {
    customFetchImpl: (...params) =>
      isTauri() ? tauriFetch(...params) : fetch(...params),
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
      }
    },
    auth: {
      type: "Bearer",
      token: () => localStorage.getItem("bearer_token") || "",
    },
  },
});
