<script lang="ts">
import { getNotesContext, getWorkspacesContext } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Collapsible from '@nota/ui/shadcn/collapsible';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { cn } from '@nota/ui/utils';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { getKeyboardShortcut, timeAgo } from '$lib/utils';
import NewNotes from '../dialogs/new-notes.svelte';
import NewWorkspace from '../dialogs/new-workspace.svelte';

let showMore = $state(false);

const cloudWorkspaces = getWorkspacesContext();
const workspaces = $derived(cloudWorkspaces.workspaces.slice(0, showMore ? undefined : 5));
const cloudNotes = getNotesContext();

let open = $state(false);
let openNewNotes = $state(false);

let currentCloudWorkspace = $derived(cloudWorkspaces.workspaces[0]);
</script>

<NewWorkspace bind:open />

<NewNotes bind:open={openNewNotes} workspace={currentCloudWorkspace} />
<Sidebar.Group>
	<Sidebar.GroupLabel class="justify-between">
		Cloud Workspaces
		<SimpleToolTip>
			<Button variant="ghost" class="size-6" onclick={() => (open = true)}>
				<icons.Plus />
			</Button>
			{#snippet child()}
				<div class="inline-flex items-center gap-1">
					<span>Create Workspace</span>
					<span class="bg-muted text-primary rounded p-0.5">{getKeyboardShortcut('N', true)}</span>
				</div>
			{/snippet}
		</SimpleToolTip>
	</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		{#if workspaces.length > 0}
			<Sidebar.Menu>
				{#each workspaces as workspace (workspace.id)}
					<Collapsible.Root>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton onclick={() => goto(resolve("/(cloud)/workspace-[id]", {id: workspace.id}))}>
								{#snippet child({ props })}
									<span {...props}>
										<IconRenderer icon={workspace.icon ?? "lucide:File"} />
										<span class="cursor-default">{workspace.name}</span>
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
										<icons.ChevronRight />
									</Sidebar.MenuAction>
								{/snippet}
							</Collapsible.Trigger>
							<Sidebar.MenuAction showOnHover>
								<SimpleToolTip content="Add Notes">
									<Button
										variant="ghost"
										class="size-6"
										onclick={() => {
											currentCloudWorkspace = workspace;
											openNewNotes = true;
										}}
									>
										<icons.Plus />
									</Button>
								</SimpleToolTip>
							</Sidebar.MenuAction>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{@const notes = cloudNotes
										.notes
										.filter((n) => n.workspace === workspace.id && !n.trashed)}
									{#each notes as note (note.id)}
										{@const href = resolve("/")}
										{@const isActive = page.url.pathname.endsWith(href)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton {isActive} onclick={() => goto(href)}>
												{#snippet child({ props })}
													<span {...props}>
														<IconRenderer icon={note.icon ?? "lucide:File"} />
														<span class="cursor-default">{note.name}</span>
													</span>
												{/snippet}
											</Sidebar.MenuSubButton>
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													{#snippet child({ props })}
														<Sidebar.MenuAction showOnHover {...props}>
															<icons.Ellipsis />
															<span class="sr-only">More</span>
														</Sidebar.MenuAction>
													{/snippet}
												</DropdownMenu.Trigger>
												<DropdownMenu.Content>
													<DropdownMenu.Item onclick={() => cloudNotes.update(note.id, { favorite: !note.favorite })}>
														{@const favorite = note.favorite}
														<icons.Star class={cn(favorite && 'fill-yellow-500 text-yellow-500')} />
														{favorite ? 'Unfavorite' : 'Favorite'}
													</DropdownMenu.Item>
													<DropdownMenu.Item onclick={() => cloudNotes.update(note.id, { isPublic: !note.isPublic })}>
														<icons.Globe />
														{note.isPublic ? 'Make Private' : 'Make Public'}
													</DropdownMenu.Item>
													<DropdownMenu.Item onclick={() => cloudNotes.duplicate(note.id)}>
														<icons.Copy />
														Duplicate
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														variant="destructive"
														onclick={() => cloudNotes.update(note.id, { trashed: true })}
													>
														<icons.Trash2 />
														Move to Trash
													</DropdownMenu.Item>
													<DropdownMenu.Item
														variant="destructive"
														onclick={() => cloudNotes.delete(note.id)}
													>
														<icons.Trash2 />
														Delete
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Label class="text-muted-foreground text-sm">
														Last Edited:
														{timeAgo(note.updatedAt.toISOString())}
													</DropdownMenu.Label>
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
						<icons.Ellipsis />
						<span>{showMore ? 'Less' : 'More'}</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{:else}
			<Sidebar.Menu>
				<Sidebar.MenuItem class="flex items-center gap-2">
					<Sidebar.MenuButton class="text-sidebar-foreground/70" onclick={() => (open = true)}>
						<icons.Plus />
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
