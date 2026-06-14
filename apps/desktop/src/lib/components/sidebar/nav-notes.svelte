<script lang="ts">
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import { icons } from "@nota/ui/icons/index.js";
  import { Button } from "@nota/ui/shadcn/button";
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { getLocalNotes } from "$lib/local/notes.svelte";
  import { getNotesContext } from "@nota/client";
  import { getCurrentWorkspace } from "$lib/currentworkspace.svelte";
  import { openNewNote } from "../dialogs";

  import RecursiveLocalNote from "./recursive-local-note.svelte";
  import RecursiveCloudNote from "./recursive-cloud-note.svelte";

  const localNotes = getLocalNotes();
  const cloudNotes = getNotesContext();
  const currentWorkspace = getCurrentWorkspace();

  const activeWorkspace = $derived(currentWorkspace?.get());
  const isCloud = $derived(activeWorkspace && "owner" in activeWorkspace);

  const localRootNotes = $derived(
    activeWorkspace && !isCloud
      ? localNotes
          .getNotes()
          .filter(
            (n) =>
              n.workspace_id === activeWorkspace.id &&
              !n.parent_note_id &&
              !n.deleted_at,
          )
      : []
  );

  const cloudRootNotes = $derived(
    activeWorkspace && isCloud
      ? cloudNotes.notes.filter(
          (n) =>
            n.workspace_id === activeWorkspace.id &&
            !n.parent_note_id &&
            !n.deleted_at,
        )
      : []
  );
</script>

{#if activeWorkspace}
  <Sidebar.Group>
    <Sidebar.GroupLabel class="justify-between">
      <span>Notes</span>
      <SimpleToolTip>
        <Button
          variant="ghost"
          class="size-6"
          onclick={() => openNewNote(activeWorkspace)}
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
        {#if isCloud}
          {#each cloudRootNotes as note (note.id)}
            <RecursiveCloudNote {note} workspace={activeWorkspace as any} />
          {/each}
          {#if cloudRootNotes.length === 0}
            <div class="text-xs text-sidebar-foreground/50 px-3 py-4 text-center select-none font-medium">
              No notes in this workspace
            </div>
          {/if}
        {:else}
          {#each localRootNotes as note (note.id)}
            <RecursiveLocalNote {note} workspace={activeWorkspace as any} />
          {/each}
          {#if localRootNotes.length === 0}
            <div class="text-xs text-sidebar-foreground/50 px-3 py-4 text-center select-none font-medium">
              No notes in this workspace
            </div>
          {/if}
        {/if}
      </Sidebar.Menu>
    </Sidebar.GroupContent>
  </Sidebar.Group>
{/if}
