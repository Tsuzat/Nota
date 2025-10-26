<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import SettingTile from './setting-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getGlobalSignInContext } from '../global-signin';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getUserIntials } from '$lib/utils';
	import { signOut } from '$lib/supabase/auth';
	const user = $derived(getSessionAndUserContext().getUser());
	const globalSignIn = getGlobalSignInContext();

	let name = $derived.by(() => {
		if (user) return user.user_metadata['full_name'];
		return 'User';
	});

	let email = $derived.by(() => {
		if (user) return user.user_metadata['email'];
		return 'user@email.com';
	});
</script>

{#if user}
	<SettingTile title="Avatar" description="Your Avatar taken from your sign in provider.">
		<Avatar.Root class="size-8 rounded-lg">
			<Avatar.Image src={user.user_metadata['avatar_url']} alt="User" />
			<Avatar.Fallback class="rounded-lg"
				>{getUserIntials(user.user_metadata['full_name'])}</Avatar.Fallback
			>
		</Avatar.Root>
	</SettingTile>
{/if}

<SettingTile title="Name" description="Update and see the name we should call you with">
	<Input value={name} onchange={() => {}} />
</SettingTile>

<SettingTile title="Email" description="Update and see the email we should identify you with">
	<Input value={email} disabled />
</SettingTile>

{#if user === null}
	<SettingTile title="Sign In" description="SignIn to use AI and cloud storage for notes.">
		<Button variant="outline" onclick={() => (globalSignIn.open = true)}>Sign In</Button>
	</SettingTile>
{:else}
	<SettingTile
		title="Sign Out"
		description="By Signing Out you'll not be able to use AI and cloud storage for notes"
	>
		<Button onclick={signOut} variant="outline">Sign Out</Button>
	</SettingTile>
{/if}
