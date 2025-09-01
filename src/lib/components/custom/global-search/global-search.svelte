<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { HomeIcon, StarIcon, Trash2Icon } from '@lucide/svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { getGlobalSearch } from './constants.svelte';
	import { goto } from '$app/navigation';
	import SimpleTooltip from '../simple-tooltip.svelte';
	import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
	import { useCloudWorkspaces } from '$lib/supabase/db/cloudworkspace.svelte';
	import { useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';

	const search = getGlobalSearch();
	const isLocal = $derived(useCurrentUserWorkspaceContext().getIsLocal());
	const workspaces = $derived.by(() => {
		if (isLocal) return getLocalWorkspaces().getWorkspaces();
		else return useCloudWorkspaces().getWorkspaces();
	});

	const notes = $derived.by(() => {
		if (isLocal) return getLocalNotes().getNotes();
		else return useCloudNotes().getNotes();
	});

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
		<Command.Group
			value="Workspaces"
			heading={isLocal ? 'Local' : 'Cloud' + ' Workspaces : ' + workspaces.length}
		>
			{#each workspaces as workspace (workspace.id)}
				{@const onselect = () => {
					goto(`${isLocal ? 'local-' : ''}workspace-${workspace.id}`);
					search.open = false;
				}}
				<Command.Item value={workspace.name} {onselect} onclick={onselect}>
					<IconRenderer icon={workspace.icon} class="mr-2 size-4" />
					<span>{workspace.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Separator />
		<Command.Group value="Notes" heading={isLocal ? 'Local' : '' + ' Notes : ' + notes.length}>
			{#each notes as note (note.id)}
				{@const onselect = () => {
					goto(`${isLocal ? 'local-' : ''}note-${note.id}`);
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
	</Command.List>
</Command.Dialog>
