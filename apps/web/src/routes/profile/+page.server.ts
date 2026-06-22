import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { user } }) => {
  if (user === null) {
    throw redirect(302, '/signin');
  }
  return { user };
};
