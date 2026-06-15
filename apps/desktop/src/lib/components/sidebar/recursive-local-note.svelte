<script lang="ts">
  import { IconRenderer, icons } from '@nota/ui/icons/index.js';
  import * as Collapsible from '@nota/ui/shadcn/collapsible';
  import * as Sidebar from '@nota/ui/shadcn/sidebar';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
  import { openNewNote } from '../dialogs';
  import type { LocalWorkSpace } from '$lib/local/workspaces.svelte';
  import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';

  import RecursiveLocalNote from './recursive-local-note.svelte';

  let props: {
    note: LocalNote;
    workspace: LocalWorkSpace;
    depth?: number;
  } = $props();

  const localNotes = getLocalNotes();
  const childNotes = $derived(
    localNotes.getNotes().filter((n) => n.parent_note_id === props.note.id && !n.deleted_at)
  );

  const href = $derived(resolve('/(local)/local-note-[id]', { id: props.note.id }));
  const isActive = $derived(page.url.pathname.endsWith(href));
  const hasChildren = $derived(childNotes.length > 0);

  async function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const menu = await Menu.new({
      items: [
        await MenuItem.new({
          text: 'New Sub-Note',
          action: () => openNewNote(props.workspace, props.note.id)
        }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await MenuItem.new({
          text: props.note.pinned ? 'Unpin' : 'Pin',
          action: () => localNotes.togglePinned(props.note)
        }),
        await MenuItem.new({
          text: 'Duplicate',
          action: () => localNotes.duplicateNote(props.workspace, props.note)
        }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await MenuItem.new({
          text: 'Move to Trash',
          action: () => localNotes.trashNote(props.note)
        }),
        await MenuItem.new({
          text: 'Delete Permanently',
          action: () => localNotes.deleteNote(props.note)
        })
      ]
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
            <IconRenderer class="size-4 shrink-0" icon={props.note.icon} />
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
          <RecursiveLocalNote note={childNote} workspace={props.workspace} depth={(props.depth ?? 0) + 1} />
        {/each}
      </Sidebar.MenuSub>
    </Collapsible.Content>
  </Collapsible.Root>
{:else}
  <Sidebar.MenuSubItem class="group/menu-item" oncontextmenu={handleContextMenu}>
    <Sidebar.MenuSubButton class="peer/menu-button" {isActive} onclick={() => goto(href)}>
      {#snippet child({ props: spanProps })}
        <span {...spanProps}>
          <IconRenderer class="size-4 shrink-0" icon={props.note.icon} />
          <span class="cursor-default flex-1 truncate">{props.note.name}</span>
        </span>
      {/snippet}
    </Sidebar.MenuSubButton>
  </Sidebar.MenuSubItem>
{/if}
