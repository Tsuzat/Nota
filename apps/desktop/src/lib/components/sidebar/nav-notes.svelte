<script lang="ts">
import { getNotesContext } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { openNewNote } from '../dialogs';
import NoteTile from './note-tile.svelte';

const currentWorkspace = $derived(getCurrentWorkspace().get());
const cloudNotes = getNotesContext();
const localNotes = getLocalNotes();
const notes = $derived.by(() => {
  if (currentWorkspace === undefined) return [];
  if ('owner' in currentWorkspace) return cloudNotes.notes.filter((n) => !n.deleted_at);
  return localNotes.getNotes().filter((n) => !n.deleted_at);
});
</script>

{#if currentWorkspace}
  <Sidebar.Group>
    <Sidebar.GroupLabel class="justify-between">
      <span>Notes</span>
      <SimpleToolTip>
        <Button
          variant="ghost"
          size="icon-sm"
          onclick={() => openNewNote(currentWorkspace)}
        >
          <icons.Plus />
        </Button>
        {#snippet child()}
          <div class="inline-flex items-center gap-1">
            <span>Create Note</span>
          </div>
        {/snippet}
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
