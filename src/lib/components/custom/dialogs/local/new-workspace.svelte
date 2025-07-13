<script lang="ts">
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { type Snippet } from 'svelte';
	import { open as openDialog } from '@tauri-apps/plugin-dialog';
	import { documentDir, resolve } from '@tauri-apps/api/path';
	import { ISTAURI } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { getLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
	import { Loader2 } from '@lucide/svelte';

	interface Props {
		open?: boolean;
		type?: 'local' | 'cloud';
		children?: Snippet<[]>;
	}

	let { open = $bindable(false), type = 'local', children }: Props = $props();

	let dir: string | undefined = $state<string>();
	let name: string | undefined = $state<string>();
	let icon: string = $state('emoji:📂');

	let loading = $state(false);

	const localWorspaces = getLocalWorkspaces();
	const currentLocalWorkspace = $derived(getLocalUserWorkspaces().getCurrentUserWorkspace());

	async function getWorkspaceDirectory() {
		const defaultPath = await documentDir();
		const directory = await openDialog({
			multiple: false,
			directory: true,
			title: 'Select Workspace Location',
			canCreateDirectories: true,
			defaultPath
		});
		if (directory) dir = directory;
	}

	async function createLocalWorkspace() {
		if (currentLocalWorkspace === undefined) {
			toast.error('Can find current user workspace');
			return;
		}
		// verify icon, name, dir
		if (!icon || !name || !dir) {
			toast.error('Please select an icon, name, and directory');
			return;
		}
		if (dir.trim() === '') {
			toast.error('Please select a valid directory');
			return;
		}

		try {
			loading = true;
			await localWorspaces.createWorkspace(icon, name, dir, currentLocalWorkspace.id);
			open = false;
		} catch (e) {
			loading = false;
			toast.error('Could not create workspace');
			return;
		} finally {
			loading = false;
		}
	}

	/**
	 * ! To be implemented
	 */
	async function createRemoteWorkspace() {}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (type === 'local') {
			console.log('createLocalWorkspace');
			await createLocalWorkspace();
		} else {
			await createRemoteWorkspace();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
		}
		if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
			event.preventDefault();
			open = true;
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
	<Dialog.Content class="" showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>New Workspace</Dialog.Title>
			<Dialog.Description
				>Create a local or remote workspace for
				<strong>
					{currentLocalWorkspace?.name}
				</strong>
			</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={handleSubmit} class="flex flex-col gap-2">
			<div class="flex w-full items-center gap-2">
				<IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
					<div class={buttonVariants({ variant: 'outline', size: 'icon' })}>
						<IconRenderer {icon} />
					</div>
				</IconPicker>
				<Input bind:value={name} placeholder="Workspace Name" type="text" required />
			</div>
			{#if type === 'local' && ISTAURI}
				<div class="flex w-full items-center gap-2">
					<Button
						variant="outline"
						class="text-muted-foreground w-full truncate"
						onclick={getWorkspaceDirectory}
					>
						{#if dir && dir.trim() !== ''}
							<span>{dir}</span>
						{:else}
							<span>Workspace Directory...</span>
						{/if}
					</Button>
				</div>
			{/if}
			<Button type="submit">
				{#if loading}
					<Loader2 class="animate-spin" />
				{/if}
				Create Workspace
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
