<script lang="ts">
import { getAuthContext, getNotesContext, getWorkspacesContext, type Note } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as Collapsible from '@nota/ui/shadcn/collapsible';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { cn } from '@nota/ui/utils';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { openNewNote } from '../dialogs/index.js';
import NoteTile from './note-tile.svelte';

interface Props {
  note: Note;
  depth?: number;
}
const { note, depth = 0 }: Props = $props();

const cloudNotes = getNotesContext();
const cloudWorkspaces = getWorkspacesContext();
const user = $derived(getAuthContext().user);

const href = $derived(resolve(`/w/${note.workspace_id}/notes/${note.id}`));
const isActive = $derived(page.url.pathname.endsWith(href));

const childNotes = $derived(
  cloudNotes.notes.filter((n) => String(n.parent_note_id) === String(note.id) && !n.deleted_at)
);

async function togglePin() {
  try {
    await cloudNotes.update(note.id, { pinned: !note.pinned });
    toast.success(note.pinned ? 'Added to Favorites' : 'Removed from Favorites');
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

async function renameNote() {
  const newName = prompt('Rename note to:', note.name);
  if (newName === null) return; // cancelled
  if (newName.trim() === '') {
    toast.error('Note name cannot be empty');
    return;
  }
  try {
    await cloudNotes.update(note.id, { name: newName });
    toast.success('Note renamed successfully');
  } catch (err) {
    console.error(err);
    toast.error('Failed to rename note');
  }
}

async function moveNoteToWorkspace(targetWorkspaceId: string) {
  try {
    await cloudNotes.moveNote(note.id, targetWorkspaceId, null);
    toast.success('Moved note successfully');
    // If we are currently viewing the note, navigate back to the workspace or to the new URL
    if (page.url.pathname.includes(note.id)) {
      goto(resolve('/w/[id]', { id: targetWorkspaceId }));
    }
  } catch (err) {
    console.error(err);
    toast.error('Failed to move note');
  }
}

async function trashNote() {
  const confirmed = confirm('Move this note to trash? You can still restore it later.');
  if (!confirmed) return;
  try {
    await cloudNotes.update(note.id, { deleted_at: new Date() });
    toast.success('Moved to Trash');
    if (page.url.pathname.includes(note.id)) {
      goto(resolve('/w/[id]', { id: String(note.workspace_id) }));
    }
  } catch (err) {
    console.error(err);
    toast.error('Failed to move note to trash');
  }
}

async function deleteNote() {
  const confirmed = confirm('Permanently delete this note? This action cannot be undone.');
  if (!confirmed) return;
  try {
    if (page.url.pathname.includes(note.id)) {
      goto(resolve('/w/[id]', { id: String(note.workspace_id) }));
    }
    await cloudNotes.delete(note.id);
    toast.success('Permanently deleted');
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
  <Sidebar.MenuItem class="my-px" style={`margin-left: ${depth * 0.5}rem`}>
    <Sidebar.MenuButton class={cn(isActive && "bg-muted")}>
      {#snippet child({ props })}
        <a {href} {...props}>
          <IconRenderer class="size-4 shrink-0" icon={note.icon} />
          <span class="truncate">{note.name}</span>
        </a>
      {/snippet}
    </Sidebar.MenuButton>
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
        <DropdownMenu.Item onclick={() => openNewNote(String(note.workspace_id), note.id)}>
          <icons.Plus />
          <span>Add Sub Note</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={togglePin}>
          {#if note.pinned}
            <icons.Pin class="size-4 text-yellow-500 fill-yellow-500" />
            <span>Remove from Pinned</span>
          {:else}
            <icons.Pin class="size-4" />
            <span>Add to Pinned</span>
          {/if}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => goto(href)}>
          <icons.ArrowUpRight class="size-4" />
          <span>Open this note</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={copyLink}>
          <icons.Link class="size-4" />
          <span>Copy link</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={duplicateNote}>
          <icons.Copy class="size-4" />
          <span>Duplicate</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onclick={renameNote}>
          <icons.Pencil class="size-4" />
          <span>Rename</span>
        </DropdownMenu.Item>

        {#if cloudWorkspaces.workspaces.length > 1}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>Move to...</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              {#each cloudWorkspaces.workspaces as ws (ws.id)}
                {#if String(ws.id) !== String(note.workspace_id)}
                  <DropdownMenu.Item onclick={() => moveNoteToWorkspace(String(ws.id))}>
                    {ws.name}
                  </DropdownMenu.Item>
                {/if}
              {/each}
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        {/if}

        <DropdownMenu.Separator />

        <DropdownMenu.Item onclick={trashNote} variant="destructive">
          <icons.Trash2 class="size-4" />
          <span>Move to Trash</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={deleteNote} variant="destructive">
          <icons.Trash2 class="size-4" />
          <span>Delete Note</span>
        </DropdownMenu.Item>

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
    <Collapsible.Content>
      <Sidebar.MenuItem>
        {#if childNotes.length > 0}
          {#each childNotes as child (child.id)}
            <NoteTile note={child} depth={depth + 1} />
          {/each}
        {:else}
          <div class="ml-6 flex my-px items-center gap-1 text-muted-foreground">
            <icons.File class="size-3.5" />
            <small class="text-[10px]">No Sub Notes...</small>
          </div>
        {/if}
      </Sidebar.MenuItem>
    </Collapsible.Content>
  </Sidebar.MenuItem>
</Collapsible.Root>
