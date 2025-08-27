<script lang="ts">
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import {
		getLocalUserWorkspaces,
		type LocalUserWorkspace
	} from '$lib/local/userworkspaces.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { getNewUserWorkspace } from '../user-workspace';
	import { toast } from 'svelte-sonner';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { goto } from '$app/navigation';
	import { Cloud, Monitor } from '@lucide/svelte';
	import {
		useCloudUserWorkspaces,
		type CloudUserWorkspace
	} from '$lib/supabase/db/clouduserworkspaces.svelte';
	import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
	import { useCloudWorkspaces } from '$lib/supabase/db/cloudworkspace.svelte';
	import { useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
	import { ISTAURI } from '$lib/utils';

	const localUserWorkspaces = getLocalUserWorkspaces();
	const localWorkspaces = getLocalWorkspaces();
	const localNotes = getLocalNotes();
	const currentUserWorkspace = useCurrentUserWorkspaceContext();
	let activeWorkspace = $derived(currentUserWorkspace.getCurrentUserWorkspace());

	const cloudUserWorkspaces = useCloudUserWorkspaces();
	const cloudWorkspaces = useCloudWorkspaces();
	const cloudNotes = useCloudNotes();

	const useNewLocalUserWorkspace = getNewUserWorkspace();

	async function selectLocalUserWorkspace(workspace: LocalUserWorkspace) {
		if (activeWorkspace?.id === workspace.id) return;
		const id = toast.loading('Changing User Workspace to ' + workspace.name);
		try {
			currentUserWorkspace.setCurrentUserWorkspace(workspace);
			await localWorkspaces.fetchWorkspaces(workspace.id);
			await localNotes.fetchNotes(workspace.id);
			goto('/home');
			toast.success('Changed User Workspace to ' + workspace.name, { id });
			cloudWorkspaces.setWorkspaces([]);
			cloudNotes.setNotes([]);
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when changing the user workspace', { id });
		}
	}

	async function selectCloudUserWorkspace(workspace: CloudUserWorkspace) {
		const id = toast.loading('Switching to cloud workspace');
		try {
			currentUserWorkspace.setCurrentUserWorkspace(workspace);
			toast.loading('Loading Workspaces', { id });
			await cloudWorkspaces.fetchWorkspaces(workspace);
			toast.loading('Loading Notes', { id });
			await cloudNotes.fetchNotes(workspace);
			toast.dismiss(id);
			goto('/home');
			toast.success('Changed User Workspace to ' + workspace.name, { id });
			localWorkspaces.setWorkspaces([]);
			localNotes.setNotes([]);
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong.');
		}
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton {...props} class="w-fit px-1.5">
						{#if activeWorkspace}
							<div
								class="bg-sidebar-primary text-sidebar-primary-foreground flex size-6 items-center justify-center rounded border p-1"
							>
								<IconRenderer icon={activeWorkspace.icon} />
							</div>
							<span class="truncate font-medium">{activeWorkspace.name}</span>
							<ChevronDownIcon class="opacity-50" />
						{:else}
							<span>Select User Workspace</span>
							<ChevronDownIcon class="opacity-50" />
						{/if}
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-fit rounded-lg" align="start" side="bottom" sideOffset={4}>
				{#if ISTAURI}
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
								<Monitor />
							</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					{/each}
				{/if}
				<DropdownMenu.Label class="text-muted-foreground text-xs"
					>Cloud User Workspaces</DropdownMenu.Label
				>
				{#each cloudUserWorkspaces.getWorkspaces() as workspace (workspace.id)}
					<DropdownMenu.Item onSelect={() => selectCloudUserWorkspace(workspace)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded border">
							<IconRenderer icon={workspace.icon} />
						</div>
						<span class="truncate">{workspace.name}</span>
						<DropdownMenu.Shortcut>
							<Cloud />
						</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					class="w-full gap-2 p-2"
					onclick={() => (useNewLocalUserWorkspace.open = true)}
				>
					<div class="bg-background flex size-6 items-center justify-center rounded-md border">
						<PlusIcon class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Add User Workspace</div>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
