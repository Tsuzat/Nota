import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { env } from "$env/dynamic/public";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { secureStorage } from "./secureStorage";

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const fetchFn = isTauri() ? tauriFetch : fetch;

interface CustomRequestInit extends RequestInit {
  fetch?: typeof fetch;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Replace or append a cookie value inside a raw `Cookie` header string. */
function upsertCookie(existing: string, name: string, value: string): string {
  const token = `${name}=${value}`;
  if (existing.includes(`${name}=`)) {
    return existing.replace(new RegExp(`${name}=[^;]*`), token);
  }
  return existing ? `${existing}; ${token}` : token;
}

/** Clear Tauri secure storage tokens on auth failure. */
async function clearTauriTokens() {
  await secureStorage.removeItem("access_token");
  await secureStorage.removeItem("refresh_token");
}

// ---------------------------------------------------------------------------
// Main request wrapper
// ---------------------------------------------------------------------------

/**
 * Authenticated fetch wrapper.
 *
 * - **Tauri**: injects `Authorization` header from secure storage.
 * - **Web (browser)**: relies on `credentials: "include"` for cookies.
 * - **Web (SSR)**: forwards incoming `Cookie` headers via `options.headers`
 *   and accepts an optional `options.fetch` (SvelteKit's server fetch).
 *
 * Automatically attempts a single token refresh on 401 / 403.
 */
export default async function request(
  url: string,
  options: CustomRequestInit = {},
): Promise<Response> {
  const { fetch: callerFetch, ...restOptions } = options;
  const doFetch = callerFetch || fetchFn;

  // --- Build headers ---
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (isTauri()) {
    headers.set(
      "Authorization",
      `Bearer ${await secureStorage.getItem("access_token")}`,
    );
    headers.set(
      "X-Nota-Desktop-Identifier",
      env.PUBLIC_DESKTOP_APP_IDENTIFIER ?? "",
    );
  }

  const fetchOptions: RequestInit = {
    ...restOptions,
    headers,
    credentials: "include",
  };

  // --- Initial request ---
  let response = await doFetch(url, fetchOptions);

  // --- Auto-refresh on 401 / 403 ---
  if (
    (response.status === 401 || response.status === 403) &&
    !url.includes("/auth/refreshtoken")
  ) {
    response = await tryRefresh(url, fetchOptions, headers, doFetch, options);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

async function tryRefresh(
  originalUrl: string,
  fetchOptions: RequestInit,
  headers: Headers,
  doFetch: typeof fetch,
  options: CustomRequestInit,
): Promise<Response> {
  try {
    // Build refresh-specific headers
    const refreshHeaders = new Headers(options.headers || {});
    if (isTauri()) {
      refreshHeaders.set("Content-Type", "application/json");
      refreshHeaders.set(
        "Authorization",
        `Bearer ${await secureStorage.getItem("refresh_token")}`,
      );
      refreshHeaders.set(
        "X-Nota-Desktop-Identifier",
        env.PUBLIC_DESKTOP_APP_IDENTIFIER ?? "",
      );
    }

    const refreshRes = await doFetch(
      `${PUBLIC_BACKEND_URL}/api/v1/auth/refreshtoken`,
      { method: "POST", headers: refreshHeaders, credentials: "include" },
    );

    if (!refreshRes.ok) {
      console.error("Token refresh failed:", await refreshRes.json());
      if (isTauri()) await clearTauriTokens();
      // Return a failed response so the caller can handle it
      return refreshRes;
    }

    // --- Update credentials for retry ---
    let setCookieHeader: string | null = null;

    if (isTauri()) {
      const { data } = await refreshRes.json();
      await secureStorage.setItem("access_token", data);
      headers.set("Authorization", `Bearer ${data}`);
    } else {
      // Web (SSR): pull the new access_token from Set-Cookie and patch
      // the forwarded Cookie header so the retry carries the fresh token.
      setCookieHeader = refreshRes.headers.get("Set-Cookie");
      if (setCookieHeader) {
        const match = setCookieHeader.match(/access_token=([^;]+)/);
        if (match) {
          const current = headers.get("Cookie") || "";
          headers.set("Cookie", upsertCookie(current, "access_token", match[1]));
        }
      }
    }

    fetchOptions.headers = headers;

    // --- Retry original request ---
    let response = await doFetch(originalUrl, fetchOptions);

    // Attach Set-Cookie so SvelteKit hooks can forward it to the browser
    if (!isTauri() && setCookieHeader) {
      const patched = new Response(response.body, response);
      patched.headers.append("Set-Cookie", setCookieHeader);
      response = patched;
    }

    return response;
  } catch (e) {
    console.error("Auto-refresh failed:", e);
    if (isTauri()) await clearTauriTokens();
    // Re-fetch so we at least return *something* (will be the 401/403)
    return doFetch(originalUrl, fetchOptions);
  }
}
