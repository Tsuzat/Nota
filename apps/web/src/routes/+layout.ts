export const ssr = false;
export const prerender = false;

import { request, UserSchema } from '@nota/client';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const load = async () => {
  const res = await request(`${PUBLIC_BACKEND_URL}/api/v1/user/me`);
  if (res.ok) {
    const user = await res.json();
    const userData = UserSchema.parse(user.data);
    return { user: userData };
  }
};
