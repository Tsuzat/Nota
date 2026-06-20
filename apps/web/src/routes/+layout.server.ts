import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user }, cookies }) => {
  return {
    user,
    cookies: cookies.getAll(),
  };
};
