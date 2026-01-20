<script lang="ts">
import { authClient } from '@nota/client';
import Github from '@nota/ui/icons/customs/github.svelte';
import Google from '@nota/ui/icons/customs/google.svelte';
import { Button } from '@nota/ui/shadcn/button';
import { signInSocial } from '@daveyplate/better-auth-tauri';



async function signInWithOAuth(provider: 'google' | 'github') {
  await signInSocial({
    authClient,
    provider
  });
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
