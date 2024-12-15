<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { OPEN_NEW_WORKSPACE_DIALOG, WORKSPACES } from '$lib/contants';
	import { createNote, getNotesByWorkspace, type NotesDB } from '$lib/database/notes';
	import { getWorkSpaces, type WorkSpaceDB } from '$lib/database/workspace';
	import { redirect } from '@sveltejs/kit';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Plus from 'lucide-svelte/icons/plus';
	import { onMount } from 'svelte';

	onMount(async () => {
		const workspaces = await getWorkSpaces();

		for (const workspace of workspaces) {
			const notes = await getNotesByWorkspace(workspace.id);
			WORKSPACES.update((workspaces) => {
				return workspaces.set(workspace, notes);
			});
		}
		// Get all notes by workspace
	});

	async function createNewNotes(workspace: WorkSpaceDB) {
		const notes = await createNote('📃', 'My Document', workspace);
		if (notes === null) return;
		WORKSPACES.update((workspaces) => {
			// Workspaces notes
			const workSpaceNotes = workspaces.get(workspace);
			if (workSpaceNotes === undefined) return workspaces;
			workSpaceNotes.push(notes);
			return workspaces.set(workspace, workSpaceNotes);
		});
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel class="flex items-center justify-between">
		<span>Workspaces</span>
		<Button
			variant="ghost"
			size="sm"
			class="size-4 p-2.5 rounded-sm"
			onclick={() => {
				OPEN_NEW_WORKSPACE_DIALOG.set(true);
			}}
		>
			<Plus />
		</Button>
	</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each $WORKSPACES.keys() as workspace (workspace.name)}
				<Collapsible.Root>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="##" {...props}>
									<span>{workspace.icon}</span>
									<span>{workspace.name}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
						<Collapsible.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuAction
									{...props}
									class="bg-sidebar-accent text-sidebar-accent-foreground left-2 data-[state=open]:rotate-90"
									showOnHover
								>
									<ChevronRight />
								</Sidebar.MenuAction>
							{/snippet}
						</Collapsible.Trigger>
						<Sidebar.MenuAction showOnHover onclick={() => createNewNotes(workspace)}>
							<Plus />
						</Sidebar.MenuAction>
						<Collapsible.Content>
							<Sidebar.MenuSub>
								{@const notes = $WORKSPACES.get(workspace) ?? []}
								{#each notes as note (note.id)}
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton onclick={() => goto(`/${note.id}`)}>
											{#snippet child({ props })}
												<span {...props}>
													<span>{note.icon}</span>
													<span>{note.name}</span>
												</span>
											{/snippet}
										</Sidebar.MenuSubButton>
									</Sidebar.MenuSubItem>
								{/each}
							</Sidebar.MenuSub>
						</Collapsible.Content>
					</Sidebar.MenuItem>
				</Collapsible.Root>
			{/each}
			<Sidebar.MenuItem>
				{#if $WORKSPACES.size === 0}
					<div class="text-sidebar-foreground/70 text-xs ml-2">No Workspaces Found</div>
				{:else}
					<Sidebar.MenuButton class="text-sidebar-foreground/70">
						<Ellipsis />
						<span class="text-xs">More</span>
					</Sidebar.MenuButton>
				{/if}
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
