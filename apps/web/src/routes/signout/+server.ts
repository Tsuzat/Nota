import { redirect } from '@sveltejs/kit';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const GET = async ({ locals, fetch, request, cookies }) => {
  await fetch(`${PUBLIC_BACKEND_URL}/api/v1/auth/signout`, {
    headers: request.headers,
  });
  locals.user = null;
  cookies.set('access_token', '', { path: '/' });
  cookies.set('refresh_token', '', { path: '/' });
  return redirect(302, '/');
};
