<script lang="ts">
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';

	const localUserWorkspaces = getLocalUserWorkspaces();
	let activeWorkspace = $derived(localUserWorkspaces.getCurrentUserWorkspace());
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton {...props} class="w-fit px-1.5">
						{#if activeWorkspace}
							<div
								class="bg-sidebar-primary text-sidebar-primary-foreground flex size-6 items-center justify-center rounded border"
							>
								<IconRenderer icon={activeWorkspace.icon} class="!size-4" />
							</div>
							<span class="truncate font-medium">{activeWorkspace.name}</span>
							<ChevronDownIcon class="opacity-50" />
						{/if}
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-64 rounded-lg" align="start" side="bottom" sideOffset={4}>
				<DropdownMenu.Label class="text-muted-foreground text-xs">Teams</DropdownMenu.Label>
				{#each localUserWorkspaces.getUserWorkspaces() as workspace, index (workspace.id)}
					<DropdownMenu.Item onSelect={() => (activeWorkspace = workspace)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded border">
							<IconRenderer icon={workspace.icon} />
						</div>
						<span class="truncate">{workspace.name}</span>
						<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="gap-2 p-2">
					<div class="bg-background flex size-6 items-center justify-center rounded-md border">
						<PlusIcon class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Add User Workspace</div>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
