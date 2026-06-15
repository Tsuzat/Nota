<script lang="ts">
import { getNotesContext, type Note, type Workspace } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as Collapsible from '@nota/ui/shadcn/collapsible';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { ask } from '@tauri-apps/plugin-dialog';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { openNewNote } from '../dialogs';

import RecursiveCloudNote from './recursive-cloud-note.svelte';

let props: {
  note: Note;
  workspace: Workspace;
  depth?: number;
} = $props();

const cloudNotes = getNotesContext();
const childNotes = $derived(cloudNotes.notes.filter((n) => n.parent_note_id === props.note.id && !n.deleted_at));

const href = $derived(resolve('/(cloud)/note-[id]', { id: props.note.id }));
const isActive = $derived(page.url.pathname.endsWith(href));
const hasChildren = $derived(childNotes.length > 0);

async function trashNotes(noteId: string) {
  const confirm = await ask('Are you sure you want to move this note to the trash?', {
    title: 'Move to Trash',
    kind: 'warning',
  });
  if (!confirm) {
    return;
  }
  toast.promise(cloudNotes.update(noteId, { deleted_at: new Date() }), {
    loading: 'Moving to Trash...',
    success: 'Moved to Trash',
    error: 'Failed to move note to Trash',
  });
}

async function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  const menu = await Menu.new({
    items: [
      await MenuItem.new({
        text: 'New Sub-Note',
        action: () => openNewNote(props.workspace, props.note.id),
      }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await MenuItem.new({
        text: props.note.pinned ? 'Unpin' : 'Pin',
        action: () => cloudNotes.update(props.note.id, { pinned: !props.note.pinned }),
      }),
      await MenuItem.new({
        text: 'Duplicate',
        action: () => cloudNotes.duplicate(props.note.id),
      }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await MenuItem.new({
        text: 'Move to Trash',
        action: () => trashNotes(props.note.id),
      }),
      await MenuItem.new({
        text: 'Delete Permanently',
        action: () => cloudNotes.delete(props.note.id),
      }),
    ],
  });

  await menu.popup();
}
</script>

{#if hasChildren}
  <Collapsible.Root>
    <Sidebar.MenuSubItem class="group/menu-item" oncontextmenu={handleContextMenu}>
      <Sidebar.MenuSubButton class="peer/menu-button pr-8" {isActive} onclick={() => goto(href)}>
        {#snippet child({ props: spanProps })}
          <span {...spanProps}>
            <IconRenderer class="size-4 shrink-0" icon={props.note.icon || 'lucide:File'} />
            <span class="cursor-default flex-1 truncate">{props.note.name}</span>
          </span>
        {/snippet}
      </Sidebar.MenuSubButton>

      <Collapsible.Trigger>
        {#snippet child({ props: actionProps })}
          <Sidebar.MenuAction
            {...actionProps}
            class="bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
            showOnHover
          >
            <icons.ChevronRight class="size-3.5" />
          </Sidebar.MenuAction>
        {/snippet}
      </Collapsible.Trigger>
    </Sidebar.MenuSubItem>

    <Collapsible.Content>
      <Sidebar.MenuSub>
        {#each childNotes as childNote (childNote.id)}
          <RecursiveCloudNote note={childNote} workspace={props.workspace} depth={(props.depth ?? 0) + 1} />
        {/each}
      </Sidebar.MenuSub>
    </Collapsible.Content>
  </Collapsible.Root>
{:else}
  <Sidebar.MenuSubItem class="group/menu-item" oncontextmenu={handleContextMenu}>
    <Sidebar.MenuSubButton class="peer/menu-button" {isActive} onclick={() => goto(href)}>
      {#snippet child({ props: spanProps })}
        <span {...spanProps}>
          <IconRenderer class="size-4 shrink-0" icon={props.note.icon || 'lucide:File'} />
          <span class="cursor-default flex-1 truncate">{props.note.name}</span>
        </span>
      {/snippet}
    </Sidebar.MenuSubButton>
  </Sidebar.MenuSubItem>
{/if}
