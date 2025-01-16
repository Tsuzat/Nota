<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { RefreshCw, Settings, Trash2 } from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover';
	import Input from '$lib/components/ui/input/input.svelte';
	import { NOTES } from '$lib/contants';
	import TrashedNotes from '../tiles/trashed-notes.svelte';
	import type { NotesDB } from '$lib/database/notes';
	import { toast } from 'svelte-sonner';
	import { check } from '@tauri-apps/plugin-updater';
	import { downloadAndInstall } from '$lib/updater';

	let search: string = $state('');

	let trashNotes: NotesDB[] = $derived.by(() => {
		return $NOTES.filter(
			(note) => note.trashed && note.name.toLowerCase().includes(search.trim().toLowerCase())
		);
	});

	let checkingUpdate = $state(false);

	async function checkUpdate() {
		if (checkingUpdate) return;
		checkingUpdate = true;
		const id = toast.loading('Checking for updates...');
		const update = await check();
		if (update) {
			toast.success('Update available', {
				id,
				description: `New version ${update.version} is available.`,
				action: {
					label: 'Download',
					onClick: async () => {
						checkingUpdate = false;
						await downloadAndInstall(update);
					}
				}
			});
		} else {
			toast.success('You are upto date', { id });
		}
		checkingUpdate = false;
	}

	let { ...restProps } = $props();
</script>

<Sidebar.Group {...restProps}>
	<Popover.Root>
		<Popover.Trigger>
			<Sidebar.MenuButton class="group/trash">
				<Trash2 class="group-hover/trash:animate-wiggle" />
				<span>Trash</span>
			</Sidebar.MenuButton>
		</Popover.Trigger>
		<Popover.Content side="right" class="p-2 max-h-60">
			<Input placeholder="Search Notes" bind:value={search} class="mb-4" />
			<div class="overflow-y-auto max-h-full">
				{#if trashNotes.length === 0}
					<div class="text-center text-muted-foreground font-bold">No notes found</div>
				{/if}
				{#each trashNotes as notes}
					<TrashedNotes {notes} />
				{/each}
			</div>
		</Popover.Content>
	</Popover.Root>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="group/settings">
					<Settings
						class="group-hover/settings:rotate-90 rotate-0 transition-transform duration-500"
					/>
					<span>Settings</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem class="group/update">
				<Sidebar.MenuButton onclick={checkUpdate}>
					<RefreshCw
						data-spin={checkingUpdate}
						class="data-[spin=true]:animate-spin group-hover/update:rotate-45 rotate-0 transition-transform duration-500"
					/>
					<span>Check Update</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
