<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { OPEN_NEW_WORKSPACE_DIALOG, WORKSPACES } from '$lib/contants';
	import { deleteNotes, updateNotesDB, type NotesDB } from '$lib/database/notes';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Plus from 'lucide-svelte/icons/plus';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Copy, FileX, Pen, Star, Trash, Trash2 } from 'lucide-svelte';
	import { confirm } from '@tauri-apps/plugin-dialog';
	import NewNotes from '../dialogs/NewNotes.svelte';
	import type { WorkSpaceDB } from '$lib/database/workspace';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/stores';

	let open: boolean = $state(false);

	//! TODO: Need to test this function when impleted the trash
	async function moveToTrash(note: NotesDB, workspace: WorkSpaceDB) {
		const shouldDelete = await confirm(
			`Are you sure you want to move notes "${note.name}" to trash?`,
			{
				kind: 'info',
				title: `Move to trash?`,
				okLabel: 'Move to Trash'
			}
		);
		if (!shouldDelete) return;
		// note.trashed = true;
		// let isUpdated = await updateNotesDB(note);
		// if (isUpdated) {
		// 	toast.success('Note moved to trash', {
		// 		description: `Note with title ${note.name} moved to trash`
		// 	});
		// } else {
		// 	toast.error('Error on moving the note to trash');
		// }
	}

	async function permanentlyDelete(note: NotesDB, workspace: WorkSpaceDB) {
		const shouldDelete = await confirm(
			`Are you sure you want to delete this note "${note.name}"?`,
			{
				kind: 'warning',
				title: 'Delete Notes?',
				okLabel: 'Delete'
			}
		);
		if (!shouldDelete) return;
		if ($page.url.pathname === `/${note.id}`) goto('/');
		const isDeleted = await deleteNotes(note);
		if (isDeleted) {
			WORKSPACES.update((workspaces) => {
				let workspaceNotes = workspaces.get(workspace);
				if (!workspaceNotes) return workspaces;
				// remove note from workspaceNotes
				workspaceNotes = workspaceNotes.filter((n) => n.id !== note.id);
				workspaces.set(workspace, workspaceNotes);
				return workspaces;
			});
			toast.success('Note deleted', {
				description: `Note with title ${note.name} deleted`
			});
		} else {
			toast.error('Error on deleting the note');
		}
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
						<Sidebar.MenuAction showOnHover onclick={() => (open = true)}>
							<NewNotes bind:open {workspace} />
							<Plus />
						</Sidebar.MenuAction>
						<Collapsible.Content>
							<Sidebar.MenuSub>
								{#each $WORKSPACES.get(workspace) ?? [] as note (note.id)}
									<Sidebar.MenuSubItem
										class="cursor-pointer flex w-full items-center justify-between"
									>
										<Sidebar.MenuSubButton onclick={() => goto(`/${note.id}`)}>
											{#snippet child({ props })}
												<span {...props}>
													<span>{note.icon}</span>
													<span>{note.name}</span>
												</span>
											{/snippet}
										</Sidebar.MenuSubButton>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class={buttonVariants({
													variant: 'ghost',
													size: 'sm',
													class: 'size-4 p-2.5 rounded-sm'
												})}
											>
												<Ellipsis />
											</DropdownMenu.Trigger>
											<DropdownMenu.Content>
												<DropdownMenu.Group>
													<DropdownMenu.Item onclick={() => (note.favorite = !note.favorite)}>
														<Star
															data-favorite={note.favorite}
															class="data-[favorite=true]:fill-yellow-400 data-[favorite=true]:text-yellow-400 fill-none mr-2"
														/>
														<span>Add to favorites</span>
													</DropdownMenu.Item>
													<DropdownMenu.Item>
														<Pen class="mr-2" />
														<span>Rename or Edit</span>
													</DropdownMenu.Item>
													<DropdownMenu.Item>
														<Copy class="mr-2" />
														<span>Duplicate</span>
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														class="data-[highlighted]:text-red-600 text-red-600"
														onclick={() => moveToTrash(note, workspace)}
													>
														<Trash2 class="mr-2" />
														<span>Move to trash</span>
													</DropdownMenu.Item>
													<DropdownMenu.Item
														class="data-[highlighted]:text-red-600 text-red-600"
														onclick={() => permanentlyDelete(note, workspace)}
													>
														<FileX class="mr-2" />
														<span>Permanently delete</span>
													</DropdownMenu.Item>
												</DropdownMenu.Group>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
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
