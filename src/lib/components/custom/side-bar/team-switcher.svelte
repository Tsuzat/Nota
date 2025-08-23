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

	const localUserWorkspaces = getLocalUserWorkspaces();
	const localWorkspaces = getLocalWorkspaces();
	const localNotes = getLocalNotes();
	let activeWorkspace = $derived(localUserWorkspaces.getCurrentUserWorkspace());

	const cloudUserWorkspaces = useCloudUserWorkspaces();

	const useNewLocalUserWorkspace = getNewUserWorkspace();

	async function selectUserWorkspace(workspace: LocalUserWorkspace) {
		if (activeWorkspace?.id === workspace.id) return;
		const id = toast.loading('Changing User Workspace to ' + workspace.name);
		try {
			localUserWorkspaces.setCurrentUserWorkspace(workspace);
			await localWorkspaces.fetchWorkspaces(workspace.id);
			await localNotes.fetchNotes(workspace.id);
			goto('/home');
			toast.success('Changed User Workspace to' + workspace.name, { id });
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when changing the user workspace', { id });
		}
	}

	async function selectCloudUserWorkspace(workspace: CloudUserWorkspace) {
		toast.info(
			'Switching to cloud user workspace will be available soon. Please use local workspaces for now.'
		);
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
						{/if}
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-fit rounded-lg" align="start" side="bottom" sideOffset={4}>
				<DropdownMenu.Label class="text-muted-foreground text-xs"
					>Local User Workspaces</DropdownMenu.Label
				>
				{#each localUserWorkspaces.getUserWorkspaces() as workspace (workspace.id)}
					<DropdownMenu.Item onSelect={() => selectUserWorkspace(workspace)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded border">
							<IconRenderer icon={workspace.icon} />
						</div>
						<span class="truncate">{workspace.name}</span>
						<DropdownMenu.Shortcut>
							<Monitor />
						</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
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
