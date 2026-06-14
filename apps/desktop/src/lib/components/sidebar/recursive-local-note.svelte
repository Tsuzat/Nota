<script lang="ts">
  import { IconRenderer, icons } from '@nota/ui/icons/index.js';
  import * as Collapsible from '@nota/ui/shadcn/collapsible';
  import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
  import * as Sidebar from '@nota/ui/shadcn/sidebar';
  import { cn } from '@nota/ui/utils';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
  import { timeAgo } from '$lib/utils';
  import { openNewNote } from '../dialogs';
  import type { LocalWorkSpace } from '$lib/local/workspaces.svelte';

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
</script>

{#snippet noteContextMenu()}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props: triggerProps })}
        <Sidebar.MenuAction showOnHover {...triggerProps}>
          <icons.Ellipsis />
          <span class="sr-only">More</span>
        </Sidebar.MenuAction>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-48" side="right" align="start">
      <DropdownMenu.Item onclick={() => openNewNote(props.workspace, props.note.id)}>
        <icons.Plus class="size-4" />
        New Sub-Note
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={() => localNotes.togglePinned(props.note)}>
        {@const pinned = props.note.pinned}
        <icons.Pin class={cn("size-4", pinned && 'fill-yellow-500 text-yellow-500')} />
        {pinned ? 'Unpin' : 'Pin'}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => localNotes.duplicateNote(props.workspace, props.note)}>
        <icons.Copy class="size-4" />
        Duplicate
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item variant="destructive" onclick={() => localNotes.trashNote(props.note)}>
        <icons.Trash2 class="size-4" />
        Move to Trash
      </DropdownMenu.Item>
      <DropdownMenu.Item variant="destructive" onclick={() => localNotes.deleteNote(props.note)}>
        <icons.Trash2 class="size-4" />
        Delete Permanently
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Label class="text-muted-foreground text-xs font-normal">
        Last Edited: {timeAgo(props.note.updated_at)}
      </DropdownMenu.Label>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#if hasChildren}
  <Collapsible.Root>
    <Sidebar.MenuSubItem class="group/menu-item">
      <Sidebar.MenuSubButton class="peer/menu-button pl-7" {isActive} onclick={() => goto(href)}>
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
            class="bg-sidebar-accent text-sidebar-accent-foreground left-2 data-[state=open]:rotate-90"
            showOnHover
          >
            <icons.ChevronRight class="size-3.5" />
          </Sidebar.MenuAction>
        {/snippet}
      </Collapsible.Trigger>

      {@render noteContextMenu()}
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
  <Sidebar.MenuSubItem class="group/menu-item">
    <Sidebar.MenuSubButton class="peer/menu-button" {isActive} onclick={() => goto(href)}>
      {#snippet child({ props: spanProps })}
        <span {...spanProps}>
          <IconRenderer class="size-4 shrink-0" icon={props.note.icon} />
          <span class="cursor-default flex-1 truncate">{props.note.name}</span>
        </span>
      {/snippet}
    </Sidebar.MenuSubButton>
    {@render noteContextMenu()}
  </Sidebar.MenuSubItem>
{/if}
