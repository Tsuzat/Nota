<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { platform } from '@tauri-apps/plugin-os';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { OPEN_NEW_WORKSPACE_DIALOG } from '$lib/contants';
	import { open } from '@tauri-apps/plugin-dialog';
	import { Ellipsis } from 'lucide-svelte';
	import { createWorkspace } from '$lib/database/workspace';
	import Iconpicker from '$lib/components/icons/iconpicker.svelte';
	import IconRender from '$lib/components/icons/icon-render.svelte';

	let dir: string | undefined = $state<string>();
	let name: string | undefined = $state<string>();
	let icon: string = $state('emoji:📂');
	let defaultPath: string | undefined = $state<string>();

	let workspacePath = $derived.by(() => {
		if (dir && name) {
			// check if the OS is windows or not
			let slash = platform() === 'windows' ? '\\' : '/';
			return `"${dir}${slash}${name}"`;
		}
		return undefined;
	});

	async function getWorkspaceDirectory() {
		const directory = await open({
			multiple: false,
			directory: true,
			title: 'Select Workspace Location',
			defaultPath
		});
		if (directory) dir = directory;
	}

	async function handleSubmit() {
		if (!dir || !name) return;
		createWorkspace(dir, name, icon);
		OPEN_NEW_WORKSPACE_DIALOG.set(false);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.metaKey) {
			e.preventDefault();
			handleSubmit();
		}

		if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			OPEN_NEW_WORKSPACE_DIALOG.set(true);
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Dialog.Root bind:open={$OPEN_NEW_WORKSPACE_DIALOG}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create New WorkSpace</Dialog.Title>
			<Dialog.Description>
				Select a folder in local storage to create a new workspace.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="flex items-center gap-4">
				<Label for="name" class="text-right">Name</Label>
				<Input
					id="name"
					bind:value={name}
					placeholder="Enter Workspace Name..."
					class="col-span-3"
				/>
			</div>
			<div class="flex items-center gap-4">
				<Label for="name" class="text-right">Icon</Label>
				<Iconpicker onSelect={(icon_) => (icon = icon_)} side="right">
					<IconRender {icon} class="text-xl border rounded" />
				</Iconpicker>
			</div>
			<div class="flex items-center gap-4">
				<Label for="workspace" class="text-right">Path</Label>
				<Input id="picture" type="text" placeholder="Pick A Folder..." bind:value={dir} />
				<Button variant="ghost" class="!size-6 p-2" onclick={getWorkspaceDirectory}>
					<Ellipsis />
				</Button>
			</div>
			<div class="text-sm text-muted-foreground">
				<span>Workspace Path: {workspacePath ?? ''}</span>
			</div>
		</div>
		<Dialog.Footer>
			<Button type="submit" onclick={handleSubmit} disabled={!name || !dir}>Create</Button>
			<Button variant="outline">Cancel</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
