import { redirect } from '@sveltejs/kit';
export const prerender = false;
export const ssr = true;

export const load = async ({ locals }) => {
  if (locals.user !== null) {
    throw redirect(302, '/profile');
  }
};
