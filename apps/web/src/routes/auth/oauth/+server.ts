import { redirect } from '@sveltejs/kit';
import { logerror } from '$lib/sentry/index.js';

export const GET = async (event) => {
  const {
    url,
    locals: { supabase },
  } = event;
  const code = url.searchParams.get('code') as string;
  const nextParam = url.searchParams.get('next') ?? '/';
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      const nextUrl = new URL(nextParam, url.origin);
      nextUrl.search = '';
      return redirect(303, nextUrl.toString());
    }
    logerror('Error when exchanging code for session in auth/oauth', { error });
  }
  return redirect(303, '/auth/auth-error');
};
