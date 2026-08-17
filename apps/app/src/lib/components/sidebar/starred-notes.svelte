<script lang="ts">
import { Plus } from "@lucide/svelte";
import { SimpleToolTip } from "@nota/ui";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Sidebar from "@nota/ui/shadcn/sidebar/index.ts";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import { getKeyboardShortcut } from "#lib/utils.ts";
import { openCreateNotes } from "../dialogs";
import NoteTile from "./note-tile.svelte";

const notesCtx = getNotesContext();
const notes = $derived(notesCtx.list.filter((note) => note.starred));
</script>

{#if notes.length > 0}
  <Sidebar.Group>
    <Sidebar.GroupLabel class="justify-between">
      <span>Starred</span>
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
