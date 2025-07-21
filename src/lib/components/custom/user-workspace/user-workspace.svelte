<script lang="ts">
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { getLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
	import { Loader2 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { getNewUserWorkspace } from '.';

	let name: string | undefined = $state<string>();
	let icon: string = $state('lucide:User');

	let loading = $state(false);
	const localUserWorkspaces = getLocalUserWorkspaces();
	const useNewLocalUserWorkspace = getNewUserWorkspace();

	async function handlesubmit(e: Event) {
		e.preventDefault();
		loading = true;
		if (!name || name.trim() === '') {
			loading = false;
			return;
		}
		try {
			await localUserWorkspaces.createUserWorkspace(name, icon);
			useNewLocalUserWorkspace.open = false;
			toast.success('User Workspace created successfully');
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when creating the user workspace');
		} finally {
			loading = false;
		}
	}
</script>

<Dialog.Root bind:open={useNewLocalUserWorkspace.open}>
	<Dialog.Content class="w-full max-w-lg">
		<Dialog.Header>
			<Dialog.Title>User Workspace</Dialog.Title>
			<Dialog.Description>
				Create a new user workspace, which can be used to organize your workspaces and notes.
			</Dialog.Description>
		</Dialog.Header>
		<form class="flex flex-col gap-2" onsubmit={handlesubmit}>
			<div class="flex w-full items-center gap-2">
				<IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
					<div class={buttonVariants({ variant: 'outline', size: 'icon' })}>
						<IconRenderer {icon} />
					</div>
				</IconPicker>
				<Input bind:value={name} placeholder="User Workspace Name" type="text" required />
			</div>
			<Button type="submit" class="w-full">
				{#if loading}
					<Loader2 class="animate-spin" />
				{/if}
				Create User Workspace
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
