<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Settings, Trash2 } from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover';
	import Input from '$lib/components/ui/input/input.svelte';
	import { NOTES, SHOW_SETTINGS } from '$lib/contants';
	import TrashedNotes from '../tiles/trashed-notes.svelte';
	import type { NotesDB } from '$lib/database/notes';
	import SettingComponent from '$lib/components/customs/dialogs/settings.svelte';

	let search: string = $state('');

	let trashNotes: NotesDB[] = $derived.by(() => {
		return $NOTES.filter(
			(note) => note.trashed && note.name.toLowerCase().includes(search.trim().toLowerCase())
		);
	});

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
		<Popover.Content side="right" class="flex flex-col p-2 max-h-60">
			<Input placeholder="Search Notes" bind:value={search} class="mb-4" />
			<div class="flex-grow overflow-y-auto">
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
		<SettingComponent />
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="group/settings" onclick={() => SHOW_SETTINGS.set(true)}>
					<Settings
						class="group-hover/settings:rotate-90 rotate-0 transition-transform duration-500"
					/>
					<span>Settings</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
