export const ssr = false;
export const prerender = false;

import { request, UserSchema } from '@nota/client';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

injectAnalytics();
injectSpeedInsights();

export const load = async () => {
  const res = await request(`${PUBLIC_BACKEND_URL}/api/user/me`);
  if (res.ok) {
    const user = await res.json();
    const userData = UserSchema.parse(user.user);
    return { user: userData };
  }
};
