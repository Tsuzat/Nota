import { toast } from '@nota/ui/shadcn/sonner';
import { createClient } from '@supabase/supabase-js';
import { invalidate } from '$app/navigation';
import { PUBLIC_SUPABASE_API_KEY, PUBLIC_SUPABASE_ENDPOINT } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_ENDPOINT;
const supabaseKey = PUBLIC_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

export function signOut() {
  toast.promise(supabase.auth.signOut, {
    loading: 'Signing you out...',
    success: () => {
      invalidate('supabase:auth');
      return 'Signed Out Successfully';
    },
    error: (err) => {
      console.error(err);
      return 'Failed to sign out';
    },
  });
}

export const auth = supabase.auth;
