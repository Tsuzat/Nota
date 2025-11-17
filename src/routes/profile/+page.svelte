<script lang="ts">
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import * as Avatar from '$lib/components/ui/avatar';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { LogOut, Trash2 } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { resolve } from '$app/paths';

	const sessionAndUser = getSessionAndUserContext();
	const user = sessionAndUser.getUser();

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}

	function handleDeleteAccount() {
		// TODO: Implement proper account deletion with confirmation
		alert('Account deletion is not implemented yet.');
	}
</script>

{#if user === null}
	<div class="container flex items-center justify-center">
		<h1>You are not logged in.</h1>
		<a href={resolve('/')}>Go to Home</a>
	</div>
{:else}
	<div class="container mx-auto max-w-4xl p-4 md:p-8">
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight">Profile</h1>
			<p class="text-muted-foreground">Manage your account and settings.</p>
		</div>

		<div class="grid gap-8">
			<Card.Root>
				<Card.Header>
					<Card.Title>User Information</Card.Title>
					<Card.Description>Your personal details.</Card.Description>
				</Card.Header>
				<Card.Content class="grid gap-6">
					<div class="flex items-center gap-4">
						<Avatar.Root class="h-16 w-16">
							{#if user?.user_metadata.avatar_url}
								<Avatar.Image
									src={user.user_metadata.avatar_url}
									alt={user.user_metadata.full_name}
								/>
							{/if}
							<Avatar.Fallback>
								{user?.user_metadata.full_name?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase()}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid gap-1">
							<div class="text-xl font-semibold">
								{user?.user_metadata.full_name ?? 'No Name'}
							</div>
							<div class="text-muted-foreground text-sm">{user?.email}</div>
						</div>
					</div>
					<div class="grid gap-2">
						<div class="text-sm font-medium">Account created</div>
						<div class="text-muted-foreground text-sm">
							{new Date(user?.created_at ?? '').toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</div>
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-end">
					<Button onclick={handleSignOut} variant="outline">
						<LogOut class="mr-2 h-4 w-4" />
						Sign Out
					</Button>
				</Card.Footer>
			</Card.Root>

			<Card.Root class="border-destructive">
				<Card.Header>
					<Card.Title class="text-destructive">Danger Zone</Card.Title>
					<Card.Description>These actions are permanent and cannot be undone.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center justify-between">
						<div>
							<div class="font-semibold">Delete Account</div>
							<div class="text-muted-foreground text-sm">
								Permanently delete your account and all associated data.
							</div>
						</div>
						<Button onclick={handleDeleteAccount} variant="destructive">
							<Trash2 class="mr-2 h-4 w-4" />
							Delete Account
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
{/if}
