import { redirect } from '@sveltejs/kit';
import { logerror } from '$lib/sentry/index.js';
import type { UserProfile } from '$lib/types.js';

export const load = async ({ parent }) => {
  const { session, supabase } = await parent();
  if (session === null) throw redirect(308, '/login');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select()
    .eq('id', session.user.id)
    .single();
  if (profileError) {
    logerror('Error while trying to fetch profile', { profileError, path: '/profile' });
  }
  return {
    session,
    user: session.user,
    supabase,
    profile: profileData as UserProfile | null,
  };
};
