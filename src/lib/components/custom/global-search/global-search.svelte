<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { ISTAURI } from '$lib/utils';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { HomeIcon, StarIcon, Trash2Icon } from '@lucide/svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { getGlobalSearch } from './constants.svelte';
	import { goto } from '$app/navigation';
	import SimpleTooltip from '../simple-tooltip.svelte';

	const search = getGlobalSearch();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			search.open = true;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open={search.open} class="rounded-lg">
	<Command.Input class="p-2" placeholder="Type a something to search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item>
				<HomeIcon class="mr-2 size-4" />
				<span>Home</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		{#if ISTAURI}
			{@const workspaces = getLocalWorkspaces().getWorkspaces()}
			<Command.Group value="Local Workspaces" heading={'Local Workspaces : ' + workspaces.length}>
				{#each workspaces as workspace}
					{@const onselect = () => {
						goto(`local-workspace-${workspace.id}`);
						search.open = false;
					}}
					<Command.Item value={workspace.name} {onselect} onclick={onselect}>
						<IconRenderer icon={workspace.icon} class="mr-2 size-4" />
						<span>{workspace.name}</span>
					</Command.Item>
				{/each}
			</Command.Group>
			<Command.Separator />
			{@const notes = getLocalNotes().getNotes()}
			<Command.Group value="Local Notes" heading={'Local Notes : ' + notes.length}>
				{#each notes as note}
					{@const onselect = () => {
						goto(`local-note-${note.id}`);
						search.open = false;
					}}
					<Command.Item value={note.name} {onselect} onclick={onselect}>
						<IconRenderer icon={note.icon} class="mr-2 size-4" />
						<span>{note.name}</span>
						<Command.Shortcut class="flex gap-1">
							{#if note.favorite}
								<SimpleTooltip content="Favorite">
									<StarIcon class="size-3 fill-amber-500 text-amber-500" />
								</SimpleTooltip>
							{/if}
							{#if note.trashed}
								<SimpleTooltip content="Trash">
									<Trash2Icon class="size-3" />
								</SimpleTooltip>
							{/if}
						</Command.Shortcut>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
