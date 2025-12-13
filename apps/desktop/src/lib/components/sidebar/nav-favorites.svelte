<script lang="ts">
import { page } from '$app/state';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { useSidebar } from '@nota/ui/shadcn/sidebar';
import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { timeAgo } from '$lib/utils';
import { openUrl } from '@tauri-apps/plugin-opener';
import { linear } from 'svelte/easing';
import { slide } from 'svelte/transition';
import { type CloudNote, useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { resolve } from '$app/paths';
import { goto } from '$app/navigation';
import { toast } from '@nota/ui/shadcn/sonner';

const sidebar = useSidebar();
let showMore = $state(false);
const localNotes = getLocalNotes();
const cloudNotes = useCloudNotes();
const currentUserWorkspace = useCurrentUserWorkspaceContext();
const notes = $derived.by(() => {
  let notes: LocalNote[] | CloudNote[] = [];
  if (currentUserWorkspace.getIsLocal()) notes = localNotes.getNotes();
  else notes = cloudNotes.getNotes();
  return notes.filter((n) => n.favorite && !n.trashed);
});

async function toggleStar(note: LocalNote | CloudNote) {
  try {
    note.favorite = !note.favorite;
    if ('owner' in note) await cloudNotes.updateNote(note);
    else await localNotes.updateNote(note);
  } catch (e) {
    toast.error('Could not update note starred');
    console.error(e);
  }
}

async function trashNote(note: LocalNote | CloudNote) {
  try {
    if ('owner' in note) await cloudNotes.moveToTrash(note);
    else await localNotes.trashNote(note);
  } catch (e) {
    toast.error('Could not update note starred');
    console.error(e);
  }
}
async function deleteNote(note: LocalNote | CloudNote) {
  try {
    if ('owner' in note) await cloudNotes.deleteNote(note);
    else await localNotes.deleteNote(note);
  } catch (e) {
    toast.error('Could not delete note');
    console.error(e);
  }
}
</script>

{#if notes.length > 0}
	<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
		<Sidebar.GroupLabel>Favorites</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each notes.filter((n) => n.favorite && !n.trashed) as note (note.id)}
				{@const isCloud = 'owner' in note}
				{@const href = isCloud
					? resolve('/(cloud)/note-[id]', { id: note.id })
					: resolve('/(local)/local-note-[id]', { id: note.id })}
				{@const isActive = page.url.pathname.endsWith(href)}
				<div transition:slide={{ easing: linear, duration: 200 }}>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<Sidebar.MenuItem onclick={() => goto(href)}>
						<Sidebar.MenuButton {isActive}>
							{#snippet child({ props })}
								<span title={note.name} {...props}>
									<IconRenderer icon={note.icon} />
									<span class="cursor-default">{note.name}</span>
								</span>
							{/snippet}
						</Sidebar.MenuButton>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuAction showOnHover {...props}>
										<icons.Ellipsis />
										<span class="sr-only">More</span>
									</Sidebar.MenuAction>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content
								class="w-fit rounded-lg"
								side={sidebar.isMobile ? 'bottom' : 'right'}
								align={sidebar.isMobile ? 'end' : 'start'}
							>
								<DropdownMenu.Item onclick={() => toggleStar(note)}>
									<icons.StarOff />
									Unfavorites
								</DropdownMenu.Item>
								{#if isCloud}
									<DropdownMenu.Item onclick={() => cloudNotes.togglePublic(note)}>
										<icons.Globe />
										{note.isPublic ? 'Make Private' : 'Make Public'}
									</DropdownMenu.Item>
								{/if}
								{#if isCloud}
									<DropdownMenu.Item
										onclick={() =>
											window.navigator.clipboard.writeText(
												`${PUBLIC_NOTA_FRONTEND_URL}/note-preview-${note.id}`
											)}
									>
										<icons.Link />
										Copy Url
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onclick={async () => {
											const url = `${PUBLIC_NOTA_FRONTEND_URL}/note-preview-${note.id}`;
											await openUrl(url);
										}}
									>
										<icons.ArrowUpRight />
										Open In Browser
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive" onclick={() => trashNote(note)}>
									<icons.Trash2 />
									Move To Trash
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => deleteNote(note)} variant="destructive">
									<icons.Trash2 />
									Delete
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Label class="text-muted-foreground text-sm">
									Last Edited:
									{timeAgo(note.updated_at)}
								</DropdownMenu.Label>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Sidebar.MenuItem>
				</div>
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
	</Sidebar.Group>
{/if}
