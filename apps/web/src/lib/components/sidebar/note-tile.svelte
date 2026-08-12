<script lang="ts">
import { IconRenderer, icons } from '@lib/icons';
import { cn } from '@lib/utils';
import { getAuthContext, getNotesContext, type Note } from '@nota/client';
import * as Collapsible from '@nota/ui/shadcn/collapsible';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { openMoveNote, openNewNote, openRenameNote } from '../dialogs';
import NoteTile from './note-tile.svelte';

interface Props {
  note: Note;
  depth?: number;
}
const { note, depth = 0 }: Props = $props();

const cloudNotes = getNotesContext();
const user = $derived(getAuthContext().user);

const href = $derived(resolve('/(app)/n/[id]', { id: note.id }));
const isActive = $derived(page.url.pathname.endsWith(href));

const openPreviewLink = () => {
  const url = `${PUBLIC_NOTA_FRONTEND_URL}/p/${note.id}`;
  window.open(url, '_blank');
};

const childNotes = $derived.by(() => {
  return cloudNotes.notes.filter((n) => n.parent_note_id === note.id && !n.deleted_at);
});

async function togglePin() {
  try {
    await cloudNotes.update(note.id, { pinned: !note.pinned });
    toast.success(note.pinned ? 'Removed from Favorites' : 'Added to Favorites');
  } catch (err) {
    console.error(err);
    toast.error('Failed to update favorite status');
  }
}

async function copyLink() {
  try {
    const link = window.location.origin + href;
    await navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  } catch (err) {
    console.error(err);
    toast.error('Failed to copy link');
  }
}

async function duplicateNote() {
  try {
    await cloudNotes.duplicate(note.id);
    toast.success('Note duplicated successfully');
  } catch (err) {
    console.error(err);
    toast.error('Failed to duplicate note');
  }
}

async function trashNote() {
  try {
    const confirm = window.confirm('Are you sure you want to move this note to trash?');
    if (!confirm) return;
    if (page.url.pathname.endsWith(`/n/${note.id}`)) goto(resolve('/'));
    await cloudNotes.delete(note.id);
    toast.success('Note moved to trash successfully');
  } catch (err) {
    console.error(err);
    toast.error('Failed to move note to trash');
  }
}

async function deleteNote() {
  try {
    const confirm = window.confirm(
      'Are you sure you want to permanently delete this note? This action cannot be undone.'
    );
    if (!confirm) return;
    if (page.url.pathname.endsWith(`/n/${note.id}`)) goto(resolve('/'));
    await cloudNotes.delete(note.id);
    toast.success('Note deleted permanently');
  } catch (err) {
    console.error(err);
    toast.error('Failed to delete note');
  }
}

function formatDate(val: number | Date | null | undefined) {
  if (!val) return '';
  const date = typeof val === 'number' ? new Date(val * 1000) : new Date(val);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (date.toDateString() === now.toDateString()) {
    return `Today at ${timeStr}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  }
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${timeStr}`;
}
</script>

<Collapsible.Root>
  <Sidebar.MenuItem class="my-px" style={`margin-left: ${depth}rem`}>
    <Sidebar.MenuButton class={cn(isActive && "bg-muted")}>
      {#snippet child({ props })}
        <a {href} {...props}>
          <IconRenderer class="size-4 shrink-0" icon={note.icon} />
          <span class="truncate">{note.name}</span>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
    {#if childNotes.length > 0}
      <Collapsible.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuAction
            {...props}
            class="bg-sidebar-accent size-6 top-1! text-sidebar-accent-foreground inset-s-1 data-[state=open]:rotate-90"
            showOnHover
          >
            <icons.ChevronRight />
          </Sidebar.MenuAction>
        {/snippet}
      </Collapsible.Trigger>
    {/if}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuAction class="size-6 top-1!" showOnHover {...props}>
            <icons.Ellipsis />
          </Sidebar.MenuAction>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side={Sidebar.useSidebar().isMobile ? "bottom" : "right"}
        class="w-56"
      >
        <DropdownMenu.Label class="text-xs text-muted-foreground px-2 py-1"
          >Note</DropdownMenu.Label
        >
        <DropdownMenu.Item onclick={() => openNewNote(note.id)}>
          <icons.Plus />
          <span>Add Sub Note</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={togglePin}>
          {#if note.pinned}
            <icons.Pin class=" text-yellow-500 fill-yellow-500" />
            <span>Remove from Pinned</span>
          {:else}
            <icons.Pin />
            <span>Add to Pinned</span>
          {/if}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={openPreviewLink}>
          <icons.ArrowUpRight />
          <span>Open in Browser</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={copyLink}>
          <icons.Link />
          <span>Copy link</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={duplicateNote}>
          <icons.Copy />
          <span>Duplicate</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={() => openRenameNote(note)}>
          <icons.Pencil />
          <span>Rename</span>
          <DropdownMenu.Shortcut>⌘⇧R</DropdownMenu.Shortcut>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={() => openMoveNote(note)}>
          <icons.FolderInput />
          <span>Move to</span>
          <DropdownMenu.Shortcut>⌘⇧P</DropdownMenu.Shortcut>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />

        <DropdownMenu.Item onclick={trashNote} variant="destructive">
          <icons.Trash2 />
          <span>Move to Trash</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={deleteNote} variant="destructive">
          <icons.Trash2 />
          <span>Delete Note</span>
        </DropdownMenu.Item>

        <!-- <DropdownMenu.Item disabled>
          <icons.RefreshCw />
          <span>Turn into wiki</span>
        </DropdownMenu.Item> -->
        <DropdownMenu.Separator />
        <div
          class="px-2 py-1.5 text-[10px] text-muted-foreground select-none leading-normal"
        >
          <div>
            Last edited by {user?.name || user?.email || "User"}
          </div>
          <div>{formatDate(note.updated_at || note.created_at)}</div>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    {#if childNotes.length > 0}
      <Collapsible.Content>
        <Sidebar.MenuItem>
          {#each childNotes as note (note.id)}
            <NoteTile {note} depth={depth + 1} />
          {/each}
        </Sidebar.MenuItem>
      </Collapsible.Content>
    {/if}
  </Sidebar.MenuItem>
</Collapsible.Root>
