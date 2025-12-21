export const ssr = false;
export const prerender = false;

import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { PUBLIC_SUPABASE_API_KEY, PUBLIC_SUPABASE_ENDPOINT } from '$env/static/public';

injectAnalytics();
injectSpeedInsights();

export const load = async ({ fetch, data, depends }) => {
  depends('supabase:auth');

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_ENDPOINT, PUBLIC_SUPABASE_API_KEY, {
        global: {
          fetch,
        },
      })
    : createServerClient(PUBLIC_SUPABASE_ENDPOINT, PUBLIC_SUPABASE_API_KEY, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return data.cookies;
          },
        },
      });

  /**
   * It's fine to use `getSession` here, because on the client, `getSession` is
   * safe, and on the server, it reads `session` from the `LayoutData`, which
   * safely checked the session using `safeGetSession`.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { supabase, session };
};
