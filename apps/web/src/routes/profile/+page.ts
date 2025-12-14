import { redirect } from '@sveltejs/kit';

export const load = async ({ parent }) => {
  const { session, supabase } = await parent();
  if (session === null) throw redirect(308, '/login');
  const { data } = await supabase.auth.getUser();
  return {
    session,
    supabase,
    user: data.user,
  };
};
