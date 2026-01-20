import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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
export default async (url: string, options: RequestInit = {}): Promise<Response> => {
  // 1. Prepare Options
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  // Inject Desktop Identifier if on Tauri
  if (isTauri()) {
    headers.set('Authorization', `Bearer ${localStorage.getItem('bearer_token') || ''}`);
  }
  const fetchFn = isTauri() ? tauriFetch : fetch;
  const currentOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };
  const response = await fetchFn(url, currentOptions);
  return response;
};
