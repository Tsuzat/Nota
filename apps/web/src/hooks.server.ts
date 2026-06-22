import { request as apiRequest } from '@nota/client';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
  const url = `${PUBLIC_BACKEND_URL}/api/v1/user/me`;
  const res = await apiRequest(url, {
    headers: event.request.headers,
    fetch: event.fetch,
  });

  if (res.ok) {
    try {
      const data: any = await res.json();
      event.locals.user = data.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  // Forward refreshed access_token cookie to the browser.
  // request.ts attaches the Set-Cookie from the refresh response
  // onto the final response headers — we parse it and use
  // event.cookies.set() which MUST happen before resolve().
  const setCookie = res.headers.get('Set-Cookie');
  if (setCookie) {
    const match = setCookie.match(/access_token=([^;]+)/);
    if (match) {
      event.cookies.set('access_token', match[1], {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
    }
  }

  return resolve(event);
};
