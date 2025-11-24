<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { auth } from '$lib/supabase';
	import { setSessionAndUserContext } from '$lib/supabase/user.svelte';
	import { invalidate } from '$app/navigation';
	import { setGlobalSignInContext, GlobalSignIn } from '$lib/components/custom/global-signin';
	import { useDeepLinkAuth } from '$lib/handleOAuth';
	import { toast } from 'svelte-sonner';
	import { setGlobalSettings } from '$lib/components/custom/settings';
	import { setTheme } from '$lib/theme';

	useDeepLinkAuth();
	setGlobalSignInContext();
	const useSettings = setGlobalSettings();
	const sessionAndUser = setSessionAndUserContext();

	let { children } = $props();

	onMount(() => {
		setTheme(useSettings.themeColor);
		const id = toast.loading('Authenticating...');
		const { data } = auth.onAuthStateChange((event, session) => {
			if (event === 'INITIAL_SESSION') {
				if (session) {
					toast.success('Signed in successfully!', { id });
				} else {
					toast.dismiss(id);
				}
			}
			if (event === 'SIGNED_OUT') {
				sessionAndUser.setSession(null);
				sessionAndUser.setUser(null);
				invalidate('supabase:auth');
			} else if (session) {
				sessionAndUser.setSession(session);
				sessionAndUser.setUser(session.user);
				if (event === 'SIGNED_IN') {
					invalidate('supabase:auth');
				}
			}
		});
		return () => data.subscription.unsubscribe();
	});
</script>

<Toaster richColors closeButton />

<GlobalSignIn />
<ModeWatcher />

{@render children()}
