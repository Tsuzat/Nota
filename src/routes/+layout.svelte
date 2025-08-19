<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { supabase } from '$lib/supabase';
	import { setSessionAndUserContext } from '$lib/supabase/user.svelte';
	import { invalidate } from '$app/navigation';
	import { setGlobalSignInContext, GlobalSignIn } from '$lib/components/custom/global-signin';
	import { useDeepLinkAuth } from '$lib/handleOAuth';

	useDeepLinkAuth();
	setGlobalSignInContext();
	const sessionAndUser = setSessionAndUserContext();

	let { children } = $props();

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
			const session = sessionAndUser.getSession();
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
				sessionAndUser.setSession(null);
				sessionAndUser.setUser(null);
			} else if (newSession?.user !== session?.user) {
				invalidate('supabase:auth');
				sessionAndUser.setSession(null);
				sessionAndUser.setUser(null);
			}
			if (event === 'INITIAL_SESSION' && newSession) {
				sessionAndUser.setSession(newSession);
				sessionAndUser.setUser(newSession?.user);
			} else if (event === 'SIGNED_IN' && newSession) {
				sessionAndUser.setSession(newSession);
				sessionAndUser.setUser(newSession?.user);
			} else if (event === 'SIGNED_OUT' && newSession) {
				invalidate('supabase:auth');
				sessionAndUser.setSession(null);
				sessionAndUser.setUser(null);
			}
		});
		return () => data.subscription.unsubscribe();
	});
</script>

<Toaster richColors closeButton />

<GlobalSignIn />
<ModeWatcher />

{@render children()}
