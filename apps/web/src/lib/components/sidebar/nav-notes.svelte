<script lang="ts">
import { getNotesContext, getWorkspacesContext } from '@nota/client';
import { icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { page } from '$app/state';
import { openNewNote } from '../dialogs/index.js';
import NoteTile from './note-tile.svelte';
import { getCurrentWorkspaceContext } from '$lib/currentworkspace.svelte';

const cloudNotes = getNotesContext();
const currentWorkspace = getCurrentWorkspaceContext();

const notes = $derived(
  cloudNotes.notes.filter(
    (n) => n.workspace_id === currentWorkspace.value?.id && !n.deleted_at && !n.parent_note_id
  )
);
</script>

{#if currentWorkspace}
  <Sidebar.Group>
    <Sidebar.GroupLabel class="justify-between">
      <span>Notes</span>
      <Button
        variant="ghost"
        size="icon-sm"
        onclick={() => openNewNote(currentWorkspace.value!.id)}
      >
        <icons.Plus class="size-4" />
      </Button>
    </Sidebar.GroupLabel>
    <Sidebar.GroupContent>
      <Sidebar.Menu>
        {#if notes.length > 0}
          {#each notes as note (note.id)}
            <NoteTile {note} />
          {/each}
        {:else}
          <div
            class="text-xs text-sidebar-foreground/50 px-3 py-4 text-center select-none font-medium"
          >
            No notes in this workspace
          </div>
        {/if}
      </Sidebar.Menu>
    </Sidebar.GroupContent>
  </Sidebar.Group>
{/if}
