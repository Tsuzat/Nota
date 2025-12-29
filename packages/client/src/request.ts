/**
 * Make a request to the given URL with the given options,
 * adding an Authorization header if an access token is found in local storage
 * @param url The URL to make the request to
 * @param options The options to pass to the fetch function
 * @param fetchFn The fetch function to use (default: global fetch)
 * @returns The response from the fetch function
 * @throws {Error} If the request fails with a non-200 status code
 */
export default async (url: string, options: RequestInit) => {
  const access_token = localStorage.getItem('access_token');
  options.headers = {
    ...options.headers,
    ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
  };
  return await fetch(url, options);
};
