<script lang="ts">
	import ArtifactDownloader from '$lib/artifact/artifact-downloader.svelte';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';
	import ToggleMode from '$lib/components/custom/toggle-mode.svelte';
	import { Button } from '$lib/components/ui/button';
	import { auth } from '$lib/supabase';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import { Github, LogOut, User, UserRound } from '@lucide/svelte';
	import * as Dropdown from '$lib/components/ui/dropdown-menu';
	import { getGlobalSignInContext } from '$lib/components/custom/global-signin';
	import { toast } from 'svelte-sonner';

	const user = $derived(getSessionAndUserContext().getUser());

	const globalSignInContext = getGlobalSignInContext();
</script>

<header class="sticky top-1 mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
	<a class="flex items-center gap-4" href="/">
		<img src="/favicon.webp" alt="Nota" class="size-10" />
		<h3 class="font-bold">Nota</h3>
	</a>
	<div class="flex items-center gap-4">
		<ToggleMode />
		{#if user === null}
			<Button onclick={() => (globalSignInContext.open = true)}>Sign In</Button>
		{:else}
			<Dropdown.Root>
				<Dropdown.Trigger>
					<SimpleTooltip content={user.email}>
						<Button onclick={async () => await auth.signOut()} size="icon" variant="ghost">
							<User />
						</Button>
					</SimpleTooltip>
				</Dropdown.Trigger>
				<Dropdown.Content class="w-fit">
					<Dropdown.Label class="text-xs">
						{user.email}
					</Dropdown.Label>
					<Dropdown.Item>
						<UserRound />
						<span>Profile</span>
					</Dropdown.Item>
					<Dropdown.Item
						onclick={() =>
							toast.promise(auth.signOut(), {
								loading: 'Signing you out...',
								success: 'Signed out successfully.',
								error: 'Something went wrong'
							})}
					>
						<LogOut />
						Sign Out
					</Dropdown.Item>
				</Dropdown.Content>
			</Dropdown.Root>
		{/if}
	</div>
</header>

<main
	class="mx-auto flex size-full max-w-4xl flex-col items-center justify-center gap-8 overflow-auto pt-8"
>
	<p class="animate-bounce">
		A fast, modern, feature rich, lightweight and local first note taking desktop application
	</p>
	<div class="flex items-center gap-4">
		<Button variant="secondary" href="https://github.com/Tsuzat/Nota" target="_blank">
			<Github />
			Visit Github
		</Button>
		<ArtifactDownloader />
	</div>
	<img
		class="hidden aspect-auto h-auto w-full dark:block"
		src="https://github.com/user-attachments/assets/ceeaf70d-bf58-4b9e-96bd-f23f2b3f2235"
		alt="nota"
	/>

	<img
		class="block aspect-auto h-auto w-full dark:hidden"
		src="https://github.com/user-attachments/assets/2b1265a0-babc-47ad-aad6-f62b36e5f681"
		alt="nota"
	/>
</main>
