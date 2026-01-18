import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * Make a request to the given URL with the given options.
 * Relies on Cookies for authentication in BOTH Web and Desktop (Tauri) environments.
 * Handles automatic token refresh if a 401 response occurs.
 *
 * Note: On Desktop, ensure you call `init()` from this package at the app start
 * to override the global fetch.
 *
 * @param url The URL to make the request to
 * @param options The options to pass to the fetch function
 * @returns The response from the fetch function
 */
export default async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // 1. Prepare Options
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject Desktop Identifier if on Tauri
  if (isTauri()) {
    headers.set(
      "Authorization",
      `Bearer ${localStorage.getItem("bearer_token") || ""}`,
    );
  }
  const fetchFn = isTauri() ? tauriFetch : fetch;

  const currentOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  // 2. Initial Request
  let response = await fetchFn(url, currentOptions);

  // 3. Handle 403 (Auto-Refresh) if access token expired or invalid
  if (response.status === 403) {
    if (url.includes("/auth/refresh")) {
      return response;
    }

    try {
      const refreshResponse = await fetchFn(
        `${PUBLIC_BACKEND_URL}/api/auth/refresh${isTauri() ? "?isDesktop=true" : ""}`,
        {
          method: "POST",
          ...(isTauri() && {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("refresh_token")}`,
            },
          }),
          credentials: "include",
        },
      );

      if (refreshResponse.ok) {
        // Retry Original Request
        if (isTauri()) {
          const { access_token } = await refreshResponse.json();
          localStorage.setItem("access_token", access_token);
        }
        response = await fetchFn(url, currentOptions);
      }
    } catch (e) {
      console.error("Auto-refresh failed", e);
    }
  }

  return response;
};
