<script lang="ts">
	import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
	import Google from '$lib/components/icons/customs/google.svelte';
	import { Button } from '$lib/components/ui/button';
	import { auth } from '$lib/supabase';
	import { ISTAURI } from '$lib/utils';
	import { invoke } from '@tauri-apps/api/core';
	import { toast } from 'svelte-sonner';

	async function signInWithGoogle() {
		try {
			const { data } = await auth.signInWithOAuth({
				provider: 'google',
				options: {
					skipBrowserRedirect: true,
					redirectTo: `${PUBLIC_NOTA_FRONTEND_URL}/auth-success`,
					queryParams: {
						access_type: 'offline',
						prompt: 'consent'
					}
				}
			});
			if (!data?.url) throw new Error('No auth URL returned');
			if (!ISTAURI) {
				window.location.href = data.url;
			} else {
				await invoke('plugin:shell|open', { path: data.url });
			}
		} catch (error) {
			console.error(error);
			toast.error('Failed to login with Google.');
		}
	}
</script>

<Button variant="secondary" class="w-full" onclick={signInWithGoogle}>
	<Google />
	Login With Google
</Button>
