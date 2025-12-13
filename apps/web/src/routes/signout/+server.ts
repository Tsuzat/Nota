import { logerror } from '$lib/sentry/index.js';
import { redirect } from '@sveltejs/kit';

export const GET = async (event) => {
  const {
    url,
    locals: { supabase },
  } = event;

  const { error } = await supabase.auth.signOut();
  if (!error) {
    return redirect(303, `/`);
  }
  logerror('Error when signing out', { error });
  // return the user to an error page with instructions
  return redirect(303, '/');
};
