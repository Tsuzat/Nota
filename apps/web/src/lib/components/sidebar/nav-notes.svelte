<script lang="ts">
import { getKeyboardShortcut } from '@lib/components/edra';
import { getNotesContext } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import { openNewNote } from '../dialogs';
import NoteTile from './note-tile.svelte';

const currentWorkspaceCtx = getCurrentWorkspace();
const currentWorkspace = $derived(currentWorkspaceCtx.get());
const cloudNotes = getNotesContext();
const notes = $derived.by(() => {
  if (!currentWorkspace) return [];
  return cloudNotes.notes.filter((n) => n.workspace_id === currentWorkspace.id && !n.deleted_at && !n.parent_note_id);
});
</script>

{#if currentWorkspace}
  <Sidebar.Group>
    <Sidebar.GroupLabel class="justify-between">
      <span>Notes</span>
      <SimpleToolTip
        content="Create New Note"
        keyboard={getKeyboardShortcut("N", true)}
      >
        <Button variant="ghost" size="icon-sm" onclick={() => openNewNote()}>
          <icons.Plus />
        </Button>
      </SimpleToolTip>
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
