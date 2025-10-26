<script lang="ts">
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { type Snippet } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { type LocalWorkSpace } from '$lib/local/workspaces.svelte';
	import Loader from '@lucide/svelte/icons/loader';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import type { CloudWorkspace } from '$lib/supabase/db/cloudworkspace.svelte';
	import { useCurrentUserWorkspaceContext } from '../../user-workspace/userworkspace.svelte';
	import { useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';

	interface Props {
		open?: boolean;
		workspace: LocalWorkSpace | CloudWorkspace;
		children?: Snippet<[]>;
	}

	let { open = $bindable(false), workspace, children }: Props = $props();

	let name: string | undefined = $state<string>();
	let icon: string = $state('lucide:FileText');
	let isFavorite = $state(false);

	let loading = $state(false);

	const localNotes = getLocalNotes();
	const currentUserWorkspace = $derived(useCurrentUserWorkspaceContext().getCurrentUserWorkspace());
	const cloudNotes = useCloudNotes();
	const user = $derived(getSessionAndUserContext().getUser());

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (currentUserWorkspace === null) {
			toast.error('Can find current user workspace');
			return;
		}
		if (name === undefined || name.trim() === '' || icon.trim() === '') {
			toast.error('Please fill in all the fields');
			return;
		}
		try {
			loading = true;
			if (!('owner' in workspace))
				await localNotes.createNote(name, icon, isFavorite, workspace, currentUserWorkspace.id);
			else {
				if (user === null) {
					toast.error('User is not logged in. Please login to create cloud notes');
					return;
				}
				await cloudNotes.createNote({
					name,
					icon,
					favorite: isFavorite,
					workspace: workspace.id,
					userworkspace: currentUserWorkspace.id,
					owner: user.id
				});
			}

			open = false;
		} catch (e) {
			loading = false;
			console.error(e);
			toast.error('Could not create notes');
			return;
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
	{#if children}
		<Dialog.Trigger>
			{@render children()}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content
		class="w-96"
		showCloseButton={false}
		portalProps={{ disabled: true, children: undefined }}
	>
		<Dialog.Header>
			<Dialog.Title>New Notes</Dialog.Title>
			<Dialog.Description
				>Create a new notes for
				<strong>
					{workspace.name}
				</strong>
			</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<div class="flex w-full items-center gap-2">
				<IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
					<div class={buttonVariants({ variant: 'outline', size: 'icon' })}>
						<IconRenderer {icon} />
					</div>
				</IconPicker>
				<Input bind:value={name} placeholder="Note Name" type="text" required />
			</div>
			<div class="flex items-center gap-2">
				<Checkbox id="toggle" bind:checked={isFavorite} />
				<Label for="toggle">Add to Favorites</Label>
			</div>
			<Button type="submit">
				{#if loading}
					<Loader class="animate-spin" />
				{/if}
				Create Note
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
