<script lang="ts">
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PlusIcon from '@lucide/svelte/icons/plus';

	const workspaces = $derived(getLocalWorkspaces().getWorkspaces());
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Local Workspaces</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		{#if workspaces.length > 0}
			<Sidebar.Menu>
				{#each workspaces as workspace (workspace.name)}
					<Collapsible.Root>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href="##" {...props}>
										<IconRenderer icon={workspace.icon} />
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
										<ChevronRightIcon />
									</Sidebar.MenuAction>
								{/snippet}
							</Collapsible.Trigger>
							<Sidebar.MenuAction showOnHover>
								<PlusIcon />
							</Sidebar.MenuAction>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{@const notes = getLocalNotes()
										.getNotes()
										.filter((n) => n.workspace === workspace.id)}
									{#each notes as note (note.name)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton>
												{#snippet child({ props })}
													<a href="##" {...props}>
														<!-- <span>{note.icon}</span> -->
														<span>📝</span>
														<span>{note.name}</span>
													</a>
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
					<Sidebar.MenuButton class="text-sidebar-foreground/70">
						<EllipsisIcon />
						<span>More</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{:else}
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton class="text-sidebar-foreground/70">
						<PlusIcon />
						<span>Create local workspace</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{/if}
	</Sidebar.GroupContent>
</Sidebar.Group>
