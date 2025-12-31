<script lang="ts">
import { toast } from '@lib/components/ui/sonner';
import { getAuthContext } from '@nota/client';
import Github from '@nota/ui/icons/customs/github.svelte';
import Google from '@nota/ui/icons/customs/google.svelte';
import { Button } from '@nota/ui/shadcn/button';
import { invoke } from '@tauri-apps/api/core';
import { getGlobalSignInContext } from './constants.svelte';

const useGlobalSignIn = getGlobalSignInContext();
const auth = getAuthContext();

async function signInWithOAuth(provider: 'google' | 'github') {
  try {
    const url = await auth.signInWithOAuth(provider, true);
    if (url) await invoke('plugin:shell|open', { path: url });
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
