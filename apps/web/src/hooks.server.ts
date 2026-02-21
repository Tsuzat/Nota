import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const handleAuth: Handle = async ({ event, resolve }) => {
  const url = `${PUBLIC_BACKEND_URL}/api/v1/user/me`;
  const res = await event.fetch(url, {
    method: 'GET',
    headers: event.request.headers,
  });
  if (res.ok) {
    try {
      const data = await res.json();
      event.locals.user = data.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }
  return resolve(event);
};

export const handle: Handle = sequence(handleAuth, Sentry.sentryHandle());
export const handleError = Sentry.handleErrorWithSentry();
