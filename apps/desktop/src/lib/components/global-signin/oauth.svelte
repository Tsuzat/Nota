<script lang="ts">
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import Google from '$lib/components/icons/customs/google.svelte';
import { Button } from '$lib/components/ui/button';
import { auth } from '$lib/supabase';
import { ISTAURI } from '$lib/utils';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'svelte-sonner';
import { getGlobalSignInContext } from './constants.svelte';
import Github from '$lib/components/icons/customs/github.svelte';
import type { Provider } from '@supabase/supabase-js';

const useGlobalSignIn = getGlobalSignInContext();

async function signInWithOAuth(provider: Provider) {
  try {
    const redirectTo = PUBLIC_NOTA_FRONTEND_URL + '/auth-success' + (ISTAURI ? '?desktop=true' : '');
    const { data, error } = await auth.signInWithOAuth({
      provider: provider,
      options: {
        skipBrowserRedirect: true,
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) toast.error(error.message);
    if (!data?.url) throw new Error('No auth URL returned');
    if (!ISTAURI) {
      window.location.href = data.url;
    } else {
      await invoke('plugin:shell|open', { path: data.url });
      useGlobalSignIn.open = false;
    }
  } catch (error) {
    console.error(error);
    toast.error('Failed to login with Google.');
  }
}
</script>

<Button variant="secondary" class="w-full" onclick={() => signInWithOAuth('google')}>
	<Google />
	Sign In With Google
</Button>

<Button variant="secondary" class="w-full" onclick={() => signInWithOAuth('github')}>
	<Github />
	Sign In With Github
</Button>
