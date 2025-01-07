<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { NOTES, OPEN_NEW_WORKSPACE_DIALOG, WORKSPACES } from '$lib/contants';
	import {
		duplicateNote,
		permanentlyDeleteNotes,
		updateNotesDB,
		type NotesDB
	} from '$lib/database/notes';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Plus from 'lucide-svelte/icons/plus';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Copy, File, FileX, FolderOpen, Pen, Star, Trash, Trash2 } from 'lucide-svelte';
	import { confirm } from '@tauri-apps/plugin-dialog';
	import NewNotes from '../dialogs/NewNotes.svelte';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { openInFileSystem, updateNOTES } from '$lib/utils';
	import Tooltip from '../tooltip.svelte';
	import IconRender from '$lib/components/icons/icon-render.svelte';
	import { deleteWorkSpacePermanently, type WorkSpaceDB } from '$lib/database/workspace';
	import { size } from '@tauri-apps/plugin-fs';
	import { resolve } from '@tauri-apps/api/path';

	let open: boolean = $state(false);

	//! TODO: Need to test this function when impleted the trash
	async function moveToTrash(note: NotesDB) {
		const shouldDelete = await confirm(
			`Are you sure you want to move notes "${note.name}" to trash?`,
			{
				kind: 'info',
				title: `Move to trash?`,
				okLabel: 'Move to Trash'
			}
		);
		if (!shouldDelete) return;
		note.trashed = true;
		let isUpdated = await updateNotesDB(note);
		if (isUpdated) {
			updateNOTES(note);
			goto('/');
			toast.success('Note moved to trash', {
				description: `Notes "${note.name}" moved to trash`
			});
		} else {
			toast.error('Error on moving the note to trash');
		}
	}

	function toggleFavorite(note: NotesDB) {
		note.favorite = !note.favorite;
		updateNotesDB(note);
		updateNOTES(note);
	}

	async function handleDeleteWorkspace(workspace: WorkSpaceDB) {
		// Get the no of notes and total size of the path
		let sizeType: string = 'KB';
		let status = await size(await resolve(workspace.path));
		// convert the status to KB
		status = status / 1024;
		if (status > 1024) {
			sizeType = 'MB';
			status = status / 1024;
		}
		if (status > 1024) {
			sizeType = 'GB';
			status = status / 1024;
		}
		status = parseFloat(status.toFixed(2));
		const notesCount = $NOTES.filter((note) => note.workspace === workspace.id).length;
		const shouldDelete = await confirm(
			`Are you sure you want to delete workspace "${workspace.name}"? This will delete "${notesCount} notes" and "${status} ${sizeType}" of the workspace folder.`,
			{
				kind: 'warning',
				title: 'Delete Workspace?',
				okLabel: 'Delete'
			}
		);
		if (!shouldDelete) return;
		// if the url is opened in notes from workspace, redirect to home page
		if (
			$NOTES.find(
				(notes) => notes.workspace === workspace.id && page.url.pathname.split('/')[1] === notes.id
			)
		)
			goto('/');
		const isDeleted = await deleteWorkSpacePermanently(workspace);
		if (isDeleted) {
			toast.success('Workspace deleted successfully');
		} else {
			toast.error('Error on deleting the workspace');
		}
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel class="flex items-center justify-between">
		<span>Workspaces</span>
		<Tooltip text="Create a Workspace">
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
		</Tooltip>
	</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each $WORKSPACES as workspace (workspace.name)}
				<NewNotes bind:open {workspace} />
				<Collapsible.Root>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="##" {...props}>
									<IconRender icon={workspace.icon} />
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
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuAction showOnHover {...props}>
										<Ellipsis />
									</Sidebar.MenuAction>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content side="right" align="start">
								<DropdownMenu.Item onclick={() => (open = true)}>
									<Plus />
									<span>Add New Note</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										openInFileSystem(workspace.path);
									}}
								>
									<FolderOpen />
									<span>Open Path</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										handleDeleteWorkspace(workspace);
									}}
									class="data-[highlighted]:text-red-600"
								>
									<Trash2 />
									<span>Delete Workspace</span>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<Collapsible.Content>
							<Sidebar.MenuSub>
								{#each $NOTES.filter((note) => note.workspace === workspace.id && !note.trashed) as note (note.id)}
									<Sidebar.MenuSubItem
										data-active={page.url.pathname === `/${note.id}`}
										class="cursor-pointer flex w-full hover:bg-muted/50 data-[active=true]:bg-muted/70 rounded-lg items-center justify-between"
									>
										<Sidebar.MenuSubButton class="flex-grow" onclick={() => goto(`/${note.id}`)}>
											{#snippet child({ props })}
												<span {...props}>
													<IconRender icon={note.icon} />
													<span
														data-trashed={note.trashed}
														class="data-[trashed=true]:line-through"
													>
														{note.name}
													</span>
												</span>
											{/snippet}
										</Sidebar.MenuSubButton>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class={buttonVariants({
													variant: 'ghost',
													size: 'sm',
													class: 'size-7 rounded-lg'
												})}
											>
												<Ellipsis />
											</DropdownMenu.Trigger>
											<DropdownMenu.Content>
												<DropdownMenu.Group>
													<DropdownMenu.Item onclick={() => toggleFavorite(note)}>
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
													<DropdownMenu.Item
														onclick={() => {
															openInFileSystem(note.path);
														}}
													>
														<FolderOpen />
														<span>Open Path</span>
													</DropdownMenu.Item>
													<DropdownMenu.Item
														onclick={() => {
															openInFileSystem(note.path, true);
														}}
													>
														<File />
														<span>Open File</span>
													</DropdownMenu.Item>
													<DropdownMenu.Item onclick={() => duplicateNote(note, workspace)}>
														<Copy class="mr-2" />
														<span>Duplicate</span>
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														class="data-[highlighted]:text-red-600 "
														onclick={() => moveToTrash(note)}
													>
														<Trash2 class="mr-2" />
														<span>Move to trash</span>
													</DropdownMenu.Item>
													<DropdownMenu.Item
														class="data-[highlighted]:text-red-600 "
														onclick={() => permanentlyDeleteNotes(note)}
													>
														<FileX class="mr-2" />
														<span>Delete</span>
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
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
