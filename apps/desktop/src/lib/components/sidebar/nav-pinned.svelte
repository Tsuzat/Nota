<script lang="ts">
import { getNotesContext, type Note } from '@nota/client';
import { icons } from '@nota/ui/icons/index.js';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import { getLocalNotes } from '$lib/local/notes.svelte';
import NoteTile from './note-tile.svelte';

let showMore = $state(false);
const localNotes = getLocalNotes();
const cloudNotes = getNotesContext();
const currentWorkspace = $derived(getCurrentWorkspace().get());

const notes = $derived.by(() => {
  if (!currentWorkspace) return [];
  if ('owner' in currentWorkspace) {
    return cloudNotes.notes.filter(
      (n) => n.workspace_id === currentWorkspace.id && n.pinned && !n.deleted_at
    );
  }
  return localNotes.getNotes().filter(
    (n) => n.workspace_id === currentWorkspace.id && n.pinned && !n.deleted_at
  );
});
</script>

{#if notes.length > 0}
  <Sidebar.Group class="group-data-[collapsible=icon]:hidden">
    <Sidebar.GroupLabel>Pinned</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each notes.slice(0, showMore ? notes.length : 3) as note (note.id)}
        <NoteTile {note} />
      {/each}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          class="text-sidebar-foreground/70"
          onclick={() => (showMore = !showMore)}
        >
          <icons.Ellipsis />
          <span>{showMore ? "Less" : "More"}</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}
