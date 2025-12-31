<script lang="ts">
import { toast } from '@lib/components/ui/sonner';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as Command from '@nota/ui/shadcn/command';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { getLocalUserWorkspaces, type LocalUserWorkspace } from '$lib/local/userworkspaces.svelte';
import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
import { getGlobalSearch } from './constants.svelte';
import { getNotesContext, getUserWorkspacesContext, getWorkspacesContext, type UserWorkspace } from '@nota/client';

const search = getGlobalSearch();
const currentUserWorkspace = useCurrentUserWorkspaceContext();
const isLocal = $derived(currentUserWorkspace.getIsLocal());
const activeWorkspace = $derived(currentUserWorkspace.getCurrentUserWorkspace());
const localUserWorkspaces = getLocalUserWorkspaces();
const localWorkspaces = getLocalWorkspaces();
const localNotes = getLocalNotes();

const cloudUserWorkspaces = getUserWorkspacesContext();
const cloudWorkspaces = getWorkspacesContext();
const cloudNotes = getNotesContext();

const workspaces = $derived.by(() => {
  if (isLocal) return getLocalWorkspaces().getWorkspaces();
  return cloudWorkspaces.workspaces;
});

const notes = $derived.by(() => {
  if (isLocal) return getLocalNotes().getNotes();
  return cloudNotes.notes;
});

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    search.open = true;
  }
}

async function selectLocalUserWorkspace(workspace: LocalUserWorkspace) {
  if (activeWorkspace?.id === workspace.id) {
    return toast.info("You're already in this workspace");
  }
  const id = toast.loading(`Changing User Workspace to ${workspace.name}`);
  try {
    goto(resolve('/'));
    currentUserWorkspace.setCurrentUserWorkspace(workspace);
    await localWorkspaces.fetchWorkspaces(workspace.id);
    await localNotes.fetchNotes(workspace.id);
    toast.success(`Changed User Workspace to ${workspace.name}`, { id });
    cloudWorkspaces.workspaces = [];
    cloudNotes.notes = [];
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong when changing the user workspace to ${workspace.name}`, { id });
  }
}

async function selectCloudUserWorkspace(workspace: UserWorkspace) {
  if (activeWorkspace?.id === workspace.id) {
    return toast.info("You're already in this workspace");
  }
  const id = toast.loading(`Switching to cloud workspace ${workspace.name}`);
  try {
    goto(resolve('/'));
    currentUserWorkspace.setCurrentUserWorkspace(workspace);
    toast.loading(`Loading Workspaces for ${workspace.name}`, { id });
    await cloudWorkspaces.fetch(workspace.id);
    toast.loading(`Loading Notes for ${workspace.name}`, { id });
    await cloudNotes.fetch(workspace.id);
    toast.dismiss(id);
    toast.success(`Changed User Workspace to ${workspace.name}`, { id });
    localWorkspaces.setWorkspaces([]);
    localNotes.setNotes([]);
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong when switching to cloud workspace ${workspace.name}`, { id });
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open={search.open} class="rounded-lg border">
	<Command.Input class="h-10 p-2 transition-colors" placeholder="Type a something to search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item>
				<icons.House class="mr-2 size-4" />
				<span>Home</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group value="User Workspaces" heading="User Workspaces">
			{#each localUserWorkspaces.getUserWorkspaces() as localUserWorkspace (localUserWorkspace.id)}
				{@const onselect = () => selectLocalUserWorkspace(localUserWorkspace)}
				<Command.Item
					itemid={localUserWorkspace.id.toString()}
					value={localUserWorkspace.name}
					{onselect}
					onclick={onselect}
				>
					<IconRenderer icon={localUserWorkspace.icon} class="mr-2 size-4" />
					<span>{localUserWorkspace.name}</span>
					<Command.Shortcut class="flex gap-1">
						{#if activeWorkspace?.id === localUserWorkspace.id}
							<SimpleToolTip content="Current Active Workspace">
								<icons.CircleCheck class="text-primary size-4" />
							</SimpleToolTip>
						{/if}
						<SimpleToolTip content="Local User Workspace">
							<icons.Monitor class="size-4" />
						</SimpleToolTip>
					</Command.Shortcut>
				</Command.Item>
			{/each}
			{#each cloudUserWorkspaces.userWorkspaces as cloudUserWorkspace (cloudUserWorkspace.id)}
				{@const onselect = () => selectCloudUserWorkspace(cloudUserWorkspace)}
				<Command.Item
					itemid={cloudUserWorkspace.id}
					value={cloudUserWorkspace.name}
					{onselect}
					onclick={onselect}
				>
					<IconRenderer icon={cloudUserWorkspace.icon} class="mr-2 size-4" />
					<span>{cloudUserWorkspace.name}</span>
					<Command.Shortcut class="flex gap-1">
						{#if activeWorkspace?.id === cloudUserWorkspace.id}
							<SimpleToolTip content="Current Active Workspace">
								<icons.CircleCheck class="text-primary size-4" />
							</SimpleToolTip>
						{/if}
						<SimpleToolTip content="Cloud User Workspace">
							<icons.Cloud class="size-4" />
						</SimpleToolTip>
					</Command.Shortcut>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Group
			value="Workspaces"
			heading={(isLocal ? 'Local' : 'Cloud') + ' Workspaces : ' + workspaces.length}
		>
			{#each workspaces as workspace (workspace.id)}
				{@const onselect = () => {
					goto(
						resolve(
							isLocal ? '/(local)/local-workspace-[id]' : '/(cloud)/workspace-[id]',
							{
								id: workspace.id
							}
						)
					);

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
			heading={(isLocal ? 'Local' : 'Cloud') + ' Notes : ' + notes.length}
		>
			{#each notes as note (note.id)}
				{@const onselect = () => {
					goto(
						resolve(isLocal ? '/(local)/local-note-[id]' : '/(cloud)/note-[id]', {
							id: note.id
						})
					);
					search.open = false;
				}}
				<Command.Item itemid={note.id.toString()} value={note.name} {onselect} onclick={onselect}>
					<IconRenderer icon={note.icon} class="mr-2 size-4" />
					<span>{note.name}</span>
					<Command.Shortcut class="flex gap-1">
						{#if note.favorite}
							<SimpleToolTip content="Favorite">
								<icons.Star class="size-3 fill-amber-500 text-amber-500" />
							</SimpleToolTip>
						{/if}
						{#if note.trashed}
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
