<script lang="ts">
import { getNotesContext } from '@nota/client';
import { icons } from '@nota/ui/icons/index.js';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { page } from '$app/state';
import NoteTile from './note-tile.svelte';

let showMore = $state(false);
const cloudNotes = getNotesContext();
const activeWorkspaceId = $derived(page.params.id);

const notes = $derived(
  cloudNotes.notes.filter(
    (n) => String(n.workspace_id) === String(activeWorkspaceId) && n.pinned && !n.deleted_at
  )
);
</script>

{#if notes.length > 0}
  <Sidebar.Group class="group-data-[collapsible=icon]:hidden">
    <Sidebar.GroupLabel>Pinned</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each notes.slice(0, showMore ? notes.length : 3) as note (note.id)}
        <NoteTile {note} />
      {/each}
      {#if notes.length > 3}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            class="text-sidebar-foreground/70"
            onclick={() => (showMore = !showMore)}
          >
            <icons.Ellipsis />
            <span>{showMore ? "Less" : "More"}</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/if}
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}
