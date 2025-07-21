<script lang="ts">
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
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

	const localUserWorkspaces = getLocalUserWorkspaces();
	const localWorkspaces = getLocalWorkspaces();
	const localNotes = getLocalNotes();
	let activeWorkspace = $derived(localUserWorkspaces.getCurrentUserWorkspace());

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
				<DropdownMenu.Label class="text-muted-foreground text-xs">Teams</DropdownMenu.Label>
				{#each localUserWorkspaces.getUserWorkspaces() as workspace, index (workspace.id)}
					<DropdownMenu.Item onSelect={() => selectUserWorkspace(workspace)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded border">
							<IconRenderer icon={workspace.icon} />
						</div>
						<span class="truncate">{workspace.name}</span>
						<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
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
