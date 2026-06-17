<script lang="ts">
import { toast } from '@lib/components/ui/sonner';
import { getNotesContext, getWorkspacesContext } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as Command from '@nota/ui/shadcn/command';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { getGlobalSearch } from './constants.svelte';
  import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';

const search = getGlobalSearch();
const localWorkspaces = getLocalWorkspaces();
const localNotes = getLocalNotes();

const cloudWorkspaces = getWorkspacesContext();
const cloudNotes = getNotesContext();

const workspaces = $derived.by(() => {
  return [...localWorkspaces.getWorkspaces(), ...cloudWorkspaces.workspaces];
});

const notes = $derived.by(() => {
  return [...localNotes.getNotes(), ...cloudNotes.notes];
});

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    search.open = true;
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open={search.open} class="border">
	<Command.Input class="h-10 p-2 transition-colors" placeholder="Type a something to search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item
				onselect={() => {
					goto(resolve('/'));
					search.open = false;
				}}
				onclick={() => {
					goto(resolve('/'));
					search.open = false;
				}}
			>
				<icons.House class="mr-2 size-4" />
				<span>Home</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group
			value="Workspaces"
			heading={'Workspaces : ' + workspaces.length}
		>
			{#each workspaces as workspace (workspace.id)}
				{@const isCloud = 'owner' in workspace}
				{@const onselect = () => {
					goto(
						resolve(
							!isCloud ? '/(local)/local-workspace-[id]' : '/(cloud)/workspace-[id]',
							{
								id: workspace.id.toString()
							}
						)
					);
					getCurrentWorkspace().set(workspace);
					search.open = false;
				}}
				<Command.Item
					itemid={workspace.id.toString()}
					value={workspace.name}
					{onselect}
					onclick={onselect}
				>
					<IconRenderer icon={workspace.icon} class="mr-2 size-4" />
					<span>{workspace.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Separator />
		<Command.Group
			value="Notes"
			heading={'Notes : ' + notes.length}
		>
			{#each notes as note (note.id)}
				{@const isCloud = 'owner' in note}
				{@const onselect = () => {
					goto(
						resolve(!isCloud ? '/(local)/local-note-[id]' : '/(cloud)/note-[id]', {
							id: note.id.toString()
						})
					);
					search.open = false;
				}}
				<Command.Item itemid={note.id.toString()} value={note.name} {onselect} onclick={onselect}>
					<IconRenderer icon={note.icon} class="mr-2 size-4" />
					<span>{note.name}</span>
					<Command.Shortcut class="flex gap-1">
						{#if note.pinned}
							<SimpleToolTip content="Pinned">
								<icons.Pin class="size-3 fill-amber-500 text-amber-500" />
							</SimpleToolTip>
						{/if}
						{#if note.deleted_at}
							<SimpleToolTip content="Trash">
								<icons.Trash2 class="size-3" />
							</SimpleToolTip>
						{/if}
					</Command.Shortcut>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
