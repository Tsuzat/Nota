<script lang="ts">
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import {
		ArrowDownFromLine,
		ArrowUpFromLine,
		CopyIcon,
		ExternalLink,
		Pencil,
		StarIcon,
		Trash2Icon
	} from '@lucide/svelte';
	import { ask } from '@tauri-apps/plugin-dialog';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { cn, getKeyboardShortcut, ISTAURI } from '$lib/utils';
	import SimpleTooltip from '../simple-tooltip.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import NewWorkspace from '../dialogs/local/new-workspace.svelte';
	import NewNotes from '../dialogs/local/new-notes.svelte';
	import { useCloudWorkspaces, type CloudWorkspace } from '$lib/supabase/db/cloudworkspace.svelte';
	import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
	import { useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';

	let showMore = $state(false);

	const cloudWorkspaces = useCloudWorkspaces();
	const workspaces = $derived(cloudWorkspaces.getWorkspaces().slice(0, showMore ? undefined : 5));
	const sidebar = Sidebar.useSidebar();
	const cloudNotes = useCloudNotes();

	let open = $state(false);
	let openNewNotes = $state(false);

	let currentCloudWorkspace = $derived(cloudWorkspaces.getWorkspaces()[0]);

	async function handleDelete(workspace: CloudWorkspace) {
		const allowed = await ask(
			'This workspace will be deleted permanently and all data will be erased.',
			{
				title: `Delete Workspace - ${workspace.name}`,
				kind: 'warning',
				okLabel: 'Yes, Delete'
			}
		);
		if (allowed) {
			toast.promise(cloudWorkspaces.deleteWorkspace(workspace.id), {
				loading: 'Deleting workspace...',
				success: () => {
					if (page.url.pathname === `workspace-${workspace.id}`) {
						goto('/home');
					}
					return `Workspace ${workspace.name} deleted successfully`;
				},
				error: `Could not delete workspace ${workspace.name}`
			});
		}
	}
</script>

<NewWorkspace bind:open />

<NewNotes bind:open={openNewNotes} workspace={currentCloudWorkspace} />
<Sidebar.Group>
	<Sidebar.GroupLabel class="justify-between">
		Cloud Workspaces
		<SimpleTooltip>
			<Button variant="ghost" class="size-6" onclick={() => (open = true)}>
				<PlusIcon />
			</Button>
			{#snippet child()}
				<div class="flex flex-col items-center gap-1">
					<span>Create Workspace</span>
					<span class="bg-muted text-primary rounded p-0.5">{getKeyboardShortcut('N', true)}</span>
				</div>
			{/snippet}
		</SimpleTooltip>
	</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		{#if workspaces.length > 0}
			<Sidebar.Menu>
				{#each workspaces as workspace (workspace.id)}
					<Collapsible.Root>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<!-- <a href="local-workspace-{workspace.id}" {...props}> -->
									<span {...props}>
										<IconRenderer icon={workspace.icon} />
										<span>{workspace.name}</span>
									</span>
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
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuAction showOnHover {...props}>
											<EllipsisIcon />
											<span class="sr-only">More</span>
										</Sidebar.MenuAction>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content
									class="bg-popover w-fit"
									side={sidebar.isMobile ? 'bottom' : 'right'}
									align={sidebar.isMobile ? 'end' : 'start'}
									portalProps={{ disabled: true, children: undefined }}
								>
									<DropdownMenu.Item
										onclick={() => {
											currentCloudWorkspace = workspace;
											openNewNotes = true;
										}}
									>
										<PlusIcon />
										<span>Create Notes</span>
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onclick={async () => {
											const url = `${PUBLIC_NOTA_FRONTEND_URL}/workspace-${workspace.id}`;
											if (ISTAURI) await openUrl(url);
											else {
												window.open(url, '_blank');
											}
										}}
									>
										<ExternalLink />
										{#if ISTAURI}
											<span>Open in Browser</span>
										{:else}
											<span>Open in new tab</span>
										{/if}
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<Pencil />
										<span>Rename</span>
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item>
										<ArrowUpFromLine />
										<span>Export Workspace</span>
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<ArrowDownFromLine />
										<span>Import Notes</span>
									</DropdownMenu.Item>
									<DropdownMenu.Item variant="destructive" onclick={() => handleDelete(workspace)}>
										<Trash2Icon />
										<span>Delete Workspace</span>
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{@const notes = cloudNotes
										.getNotes()
										.filter((n) => n.workspace === workspace.id && !n.trashed)}
									{#each notes as note (note.id)}
										{@const href = `note-${note.id}`}
										{@const isActive = page.url.pathname.endsWith(href)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton {isActive}>
												{#snippet child({ props })}
													<a {href} {...props}>
														<IconRenderer icon={note.icon} />
														<span>{note.name}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													{#snippet child({ props })}
														<Sidebar.MenuAction showOnHover {...props}>
															<EllipsisIcon />
															<span class="sr-only">More</span>
														</Sidebar.MenuAction>
													{/snippet}
												</DropdownMenu.Trigger>
												<DropdownMenu.Content>
													<DropdownMenu.Item>
														{@const favorite = note.favorite}
														<StarIcon class={cn(favorite && 'fill-yellow-500 text-yellow-500')} />
														{favorite ? 'Unfavorite' : 'Favorite'}
													</DropdownMenu.Item>
													<DropdownMenu.Item onclick={() => cloudNotes.duplicate(note)}>
														<CopyIcon />
														Duplicate
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														variant="destructive"
														onclick={() => cloudNotes.moveToTrash(note.id)}
													>
														<Trash2Icon />
														Move to Trash
													</DropdownMenu.Item>
													<DropdownMenu.Item
														variant="destructive"
														onclick={() => cloudNotes.deleteNote(note.id)}
													>
														<Trash2Icon />
														Delete
													</DropdownMenu.Item>
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
					<Sidebar.MenuButton
						class="text-sidebar-foreground/70"
						onclick={() => (showMore = !showMore)}
					>
						<EllipsisIcon />
						<span>{showMore ? 'Less' : 'More'}</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{:else}
			<Sidebar.Menu>
				<Sidebar.MenuItem class="flex items-center gap-2">
					<Sidebar.MenuButton class="text-sidebar-foreground/70" onclick={() => (open = true)}>
						<PlusIcon />
						<span>Add Workspace</span>
						<Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded p-1">
							{getKeyboardShortcut('N', true)}
						</Sidebar.MenuBadge>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{/if}
	</Sidebar.GroupContent>
</Sidebar.Group>
