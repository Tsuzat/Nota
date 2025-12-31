<script lang="ts">
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { getLocalUserWorkspaces, type LocalUserWorkspace } from '$lib/local/userworkspaces.svelte';
import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { getNewUserWorkspace } from '../user-workspace';
import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
import { getNotesContext, getUserWorkspacesContext, getWorkspacesContext, type UserWorkspace } from '@nota/client';

const localUserWorkspaces = getLocalUserWorkspaces();
const localWorkspaces = getLocalWorkspaces();
const localNotes = getLocalNotes();
const currentUserWorkspace = useCurrentUserWorkspaceContext();
let activeWorkspace = $derived(currentUserWorkspace.getCurrentUserWorkspace());

const cloudUserWorkspaces = getUserWorkspacesContext();
const cloudWorkspaces = getWorkspacesContext();
const cloudNotes = getNotesContext();

const useNewLocalUserWorkspace = getNewUserWorkspace();

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

async function selectCloudUserWorkspace(userWorkspace: UserWorkspace) {
  if (activeWorkspace?.id === userWorkspace.id) {
    return toast.info("You're already in this workspace");
  }
  const id = toast.loading(`Switching to cloud workspace ${userWorkspace.name}`);
  try {
    goto(resolve('/'));
    currentUserWorkspace.setCurrentUserWorkspace(userWorkspace);
    toast.loading('Loading Workspaces', { id });
    await cloudWorkspaces.fetch(userWorkspace.id);
    toast.loading('Loading Notes', { id });
    await cloudNotes.fetch(userWorkspace.id);
    toast.dismiss(id);
    toast.success(`Changed User Workspace to ${userWorkspace.name}`, { id });
    localWorkspaces.setWorkspaces([]);
    localNotes.setNotes([]);
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong when switching to cloud workspace ${userWorkspace.name}`, { id });
  }
}
</script>

<Sidebar.Menu class="mt-4">
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton {...props} class="w-full px-1.5">
						{#if activeWorkspace}
							<div
								class="bg-sidebar-primary text-sidebar-primary-foreground flex size-6 items-center justify-center rounded border p-1"
							>
								<IconRenderer icon={activeWorkspace.icon} />
							</div>
							<span class="truncate font-medium">{activeWorkspace.name}</span>
							<icons.ChevronDown class="opacity-50 ml-auto" />
						{:else}
							<span>Select User Workspace</span>
							<icons.ChevronDown class="opacity-50 ml-auto" />
						{/if}
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-fit rounded-lg" align="start" side="bottom" sideOffset={4}>
					<DropdownMenu.Label class="text-muted-foreground text-xs"
						>Local User Workspaces</DropdownMenu.Label
					>
					{#each localUserWorkspaces.getUserWorkspaces() as workspace (workspace.id)}
						<DropdownMenu.Item
							onSelect={() => selectLocalUserWorkspace(workspace)}
							class="gap-2 p-2"
						>
							<div class="flex size-6 items-center justify-center rounded border">
								<IconRenderer icon={workspace.icon} />
							</div>
							<span class="truncate">{workspace.name}</span>
							<DropdownMenu.Shortcut>
								<icons.Monitor />
							</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					{/each}
				{#if cloudUserWorkspaces.userWorkspaces.length > 0}
					<DropdownMenu.Label class="text-muted-foreground text-xs"
						>Cloud User Workspaces</DropdownMenu.Label
					>
				{/if}
				{#each cloudUserWorkspaces.userWorkspaces as workspace (workspace.id)}
					<DropdownMenu.Item onSelect={() => selectCloudUserWorkspace(workspace)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded border">
							<IconRenderer icon={workspace.icon} />
						</div>
						<span class="truncate">{workspace.name}</span>
						<DropdownMenu.Shortcut>
							<icons.Cloud />
						</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					class="w-full gap-2 p-2"
					onclick={() => (useNewLocalUserWorkspace.open = true)}
				>
					<div class="bg-background flex size-6 items-center justify-center rounded-md border">
						<icons.Plus class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Add User Workspace</div>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
