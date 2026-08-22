<script lang="ts">
import Plus from "@lucide/svelte/icons/plus";
import { SimpleToolTip } from "@nota/ui/custom/index.js";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import * as Sidebar from "@nota/ui/shadcn/sidebar/index.ts";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { getKeyboardShortcut } from "#lib/utils.ts";
import { openCreateNotes } from "../dialogs";
import NoteTile from "./note-tile.svelte";

const currentWorkspace = $derived(getWorkspaceContext().current);
const notes = $derived(getNotesContext().list);
</script>

{#if currentWorkspace}
  <Sidebar.Group>
    <Sidebar.GroupLabel class="justify-between">
      <span>Notes</span>
      <SimpleToolTip content="Create New Note" keyboard={getKeyboardShortcut("N", true)}>
        <Button
          variant="ghost"
          size="icon-sm"
          onclick={() => openCreateNotes()}
        >
          <Plus />
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
