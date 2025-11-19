<script lang="ts">
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import OAuth from '$lib/components/custom/global-signin/oauth.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import Button from '$lib/components/ui/button/button.svelte';
	import { supabase } from '$lib/supabase';
	import { toast } from 'svelte-sonner';

	const useSessionAndUser = getSessionAndUserContext();

	const user = $derived(useSessionAndUser.getUser());
	const session = $derived(useSessionAndUser.getSession());

	async function handleSignout() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			toast.error(error.message);
		} else {
			toast.success('Signed out successfully');
		}
	}

	async function handleDeleteUser() {
		if (!confirm('Are you sure you want to delete your account? This action is irreversible.')) {
			return;
		}
		// You would typically call a Supabase function to delete the user data.
		// For now, we will just sign out.
		toast.warning('Delete user functionality is not implemented yet.');
		await handleSignout();
	}
</script>

<div class="mx-auto w-120 p-6">
	{#if user}
		<div class="flex items-center space-x-4">
			<Avatar.Root class="h-16 w-16">
				<Avatar.Image src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
				<Avatar.Fallback>
					{user.user_metadata.full_name?.charAt(0) ?? user.email?.charAt(0)}
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="space-y-1">
				<div class="text-lg font-semibold">
					{user.user_metadata.full_name ?? 'No name'}
				</div>
				<div class="text-muted-foreground text-sm">{user.email}</div>
				<div class="text-muted-foreground text-xs">
					Provider: {session?.provider_token ? 'oauth' : 'email'}
				</div>
			</div>
		</div>
		<div class="mt-6 flex space-x-2">
			<Button onclick={handleSignout}>Sign Out</Button>
			<Button variant="destructive" onclick={handleDeleteUser}>Delete Account</Button>
		</div>
	{:else}
		<h2 class="text-lg font-medium">Login to your Account</h2>
		<p class="text-muted-foreground mb-4">
			Sign in to sync your notes and access them from anywhere.
		</p>
		<div class="flex flex-col gap-4">
			<OAuth />
		</div>
	{/if}
</div>
