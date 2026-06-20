<script lang="ts">
import { getNotesContext, getWorkspacesContext } from '@nota/client';
import { icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { page } from '$app/state';
import { openNewNote } from '../dialogs/index.js';
import NoteTile from './note-tile.svelte';

const cloudNotes = getNotesContext();
const cloudWorkspaces = getWorkspacesContext();

const activeWorkspaceId = $derived(page.params.id);
const currentWorkspace = $derived(cloudWorkspaces.workspaces.find((w) => String(w.id) === String(activeWorkspaceId)));

const notes = $derived(
  cloudNotes.notes.filter(
    (n) => String(n.workspace_id) === String(activeWorkspaceId) && !n.deleted_at && !n.parent_note_id
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
        onclick={() => openNewNote(String(currentWorkspace.id))}
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
