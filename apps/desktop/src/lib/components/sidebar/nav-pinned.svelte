<script lang="ts">
import { getNotesContext, type Note } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { useSidebar } from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { openUrl } from '@tauri-apps/plugin-opener';
import { linear } from 'svelte/easing';
import { slide } from 'svelte/transition';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import {  getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { timeAgo } from '$lib/utils';
import { Menu, MenuItem as TauriMenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
  import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
  import NoteTile from './note-tile.svelte';

const sidebar = useSidebar();
let showMore = $state(false);
const localNotes = getLocalNotes()
const cloudNotes = getNotesContext()
const currentWorkspace = $derived(getCurrentWorkspace().get())

const notes = $derived.by(() => {
	if (!currentWorkspace) return []
	if ('owner' in currentWorkspace) return cloudNotes.notes.filter((n) => n.pinned && !n.deleted_at)
	else return localNotes.getNotes().filter((n) => n.pinned && !n.deleted_at)
})


async function togglePin(note: LocalNote | Note) {
  try {
    note.pinned = !note.pinned;
    if ('owner' in note) await cloudNotes.update(note.id, { pinned: note.pinned });
    else await localNotes.updateNote(note);
  } catch (e) {
    toast.error('Could not update note pinned state');
    console.error(e);
  }
}

async function trashNote(note: LocalNote | Note) {
  try {
    if ('owner' in note) await cloudNotes.update(note.id, { deleted_at: new Date() });
    else await localNotes.trashNote(note);
  } catch (e) {
    toast.error('Could not move note to trash');
    console.error(e);
  }
}

async function deleteNote(note: LocalNote | Note) {
  try {
    if ('owner' in note) await cloudNotes.delete(note.id);
    else await localNotes.deleteNote(note);
  } catch (e) {
    toast.error('Could not delete note');
    console.error(e);
  }
}

async function handleContextMenu(e: MouseEvent, note: LocalNote | Note) {
  e.preventDefault();
  e.stopPropagation();

  const isCloud = 'owner' in note;
  const menuItems: any[] = [];

  menuItems.push(
    await TauriMenuItem.new({
      text: 'Unpin',
      action: () => togglePin(note)
    })
  );

  if (isCloud) {
    menuItems.push(
      await TauriMenuItem.new({
        text: note.is_public ? 'Make Private' : 'Make Public',
        action: () => cloudNotes.update(note.id, { is_public: !note.is_public })
      }),
      await TauriMenuItem.new({
        text: 'Copy Url',
        action: () => window.navigator.clipboard.writeText(`${PUBLIC_NOTA_FRONTEND_URL}/note-preview-${note.id}`)
      }),
      await TauriMenuItem.new({
        text: 'Open In Browser',
        action: async () => {
          const url = `${PUBLIC_NOTA_FRONTEND_URL}/note-preview-${note.id}`;
          await openUrl(url);
        }
      })
    );
  }

  menuItems.push(await PredefinedMenuItem.new({ item: 'Separator' }));

  menuItems.push(
    await TauriMenuItem.new({
      text: 'Move To Trash',
      action: () => trashNote(note)
    }),
    await TauriMenuItem.new({
      text: 'Delete Permanently',
      action: () => deleteNote(note)
    })
  );

  const menu = await Menu.new({ items: menuItems });
  await menu.popup();
}
</script>

{#if notes.length > 0}
	<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
		<Sidebar.GroupLabel>Pinned</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each notes as note (note.id)}
				{@const isCloud = 'owner' in note}
				{@const href = isCloud
					? resolve('/(cloud)/note-[id]', { id: note.id })
					: resolve('/(local)/local-note-[id]', { id: note.id })}
				<div transition:slide={{ easing: linear, duration: 200 }}>
					<NoteTile {note} />	
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
