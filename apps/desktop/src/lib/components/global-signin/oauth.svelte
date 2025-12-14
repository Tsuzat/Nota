<script lang="ts">
import { toast } from '@lib/components/ui/sonner';
import Github from '@nota/ui/icons/customs/github.svelte';
import Google from '@nota/ui/icons/customs/google.svelte';
import { Button } from '@nota/ui/shadcn/button';
import type { Provider } from '@supabase/supabase-js';
import { invoke } from '@tauri-apps/api/core';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { auth } from '$lib/supabase';
import { getGlobalSignInContext } from './constants.svelte';

const useGlobalSignIn = getGlobalSignInContext();

async function signInWithOAuth(provider: Provider) {
  try {
    const redirectTo = `${PUBLIC_NOTA_FRONTEND_URL}/auth-success?desktop=true`;
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
    await invoke('plugin:shell|open', { path: data.url });
    useGlobalSignIn.open = false;
  } catch (error) {
    console.error(error);
    toast.error(`Failed to login with ${provider}.`);
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
