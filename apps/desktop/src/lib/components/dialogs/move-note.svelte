<script lang="ts" module>
  import type { LocalNote } from "$lib/local/notes.svelte";
  import type { Note } from "@nota/client";

  let open = $state(false);
  let noteToMove = $state<LocalNote | Note | null>(null);

  export const openMoveNote = (note: LocalNote | Note) => {
    open = true;
    noteToMove = note;
  };
</script>

<script lang="ts">
  import { toast } from "@nota/ui/shadcn/sonner";
  import { getWorkspacesContext, getNotesContext } from "@nota/client";
  import { getLocalWorkspaces } from "$lib/local/workspaces.svelte";
  import { getLocalNotes } from "$lib/local/notes.svelte";
  import { Button } from "@nota/ui/shadcn/button";
  import * as Dialog from "@nota/ui/shadcn/dialog";
  import * as Select from "@nota/ui/shadcn/select";
  import { IconRenderer, icons } from "@lib/icons";
  import { BarSpinner } from "@nota/ui/icons/index.js";

  let loading = $state(false);

  // Determine type
  const isCloud = $derived(noteToMove ? "owner" in noteToMove : false);

  // Local contexts
  const localWorkspaces = getLocalWorkspaces();
  const localNotes = getLocalNotes();

  // Cloud contexts
  const cloudWorkspaces = getWorkspacesContext();
  const cloudNotes = getNotesContext();

  // Workspaces list
  const workspaces = $derived(
    isCloud ? cloudWorkspaces.workspaces : localWorkspaces.getWorkspaces(),
  );

  // Selected workspace state
  let selectedWorkspaceId = $state<string>("");
  let selectedWorkspaceName = $derived(
    workspaces.find((w) => w.id === selectedWorkspaceId)?.name ||
      "Select Workspace",
  );

  // Sync selectedWorkspaceId when noteToMove changes
  $effect(() => {
    if (noteToMove) {
      selectedWorkspaceId = noteToMove.workspace_id;
    }
  });

  // All notes list
  const allNotes = $derived(isCloud ? cloudNotes.notes : localNotes.getNotes());

  // Helper function to find descendant note IDs to avoid cyclicity
  function getDescendantIds(
    noteId: string,
    notesList: (LocalNote | Note)[],
  ): Set<string> {
    const descendants = new Set<string>();
    const queue = [noteId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = notesList.filter((n) => n.parent_note_id === currentId);
      for (const child of children) {
        if (!descendants.has(child.id)) {
          descendants.add(child.id);
          queue.push(child.id);
        }
      }
    }
    return descendants;
  }

  const descendantIds = $derived(
    noteToMove ? getDescendantIds(noteToMove.id, allNotes) : new Set<string>(),
  );

  // Valid target parents in the selected workspace
  const allowedParents = $derived(
    allNotes.filter(
      (n) =>
        n.workspace_id === selectedWorkspaceId &&
        noteToMove &&
        n.id !== noteToMove.id &&
        !descendantIds.has(n.id) &&
        !n.deleted_at,
    ),
  );

  // Selected parent note state
  let selectedParentNoteId = $state<string | null>(null);

  // Sync selectedParentNoteId when noteToMove or selectedWorkspaceId changes
  $effect(() => {
    if (noteToMove) {
      // If the selected workspace is the note's original workspace, default to its original parent
      if (selectedWorkspaceId === noteToMove.workspace_id) {
        selectedParentNoteId = noteToMove.parent_note_id ?? null;
      } else {
        // If workspace changed, default to root note (null)
        selectedParentNoteId = null;
      }
    }
  });

  let selectedParentNoteName = $derived(
    selectedParentNoteId === null
      ? "None (Root Note)"
      : allowedParents.find((n) => n.id === selectedParentNoteId)?.name ||
          "Select Parent Note",
  );

  async function handleMove() {
    if (!noteToMove) return;
    loading = true;
    try {
      if (isCloud) {
        await cloudNotes.moveNote(
          noteToMove.id,
          selectedWorkspaceId,
          selectedParentNoteId,
        );
      } else {
        await localNotes.moveNote(
          noteToMove.id,
          selectedWorkspaceId,
          selectedParentNoteId,
        );
      }
      open = false;
    } catch (err) {
      console.error(err);
      toast.error("Failed to move note");
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
  <Dialog.Content class="w-96" showCloseButton={true}>
    <Dialog.Header>
      <Dialog.Title>Move Note</Dialog.Title>
      <Dialog.Description>
        Move <strong>{noteToMove?.name}</strong> to a different workspace or note.
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex flex-col gap-4 py-2">
      <!-- Workspace Selection -->
      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium">Destination Workspace</span>
        <Select.Root type="single" bind:value={selectedWorkspaceId}>
          <Select.Trigger class="w-full flex items-center justify-between">
            <span class="truncate flex items-center gap-2">
              {#if noteToMove}
                {@const currentWorkspace = workspaces.find(
                  (w) => w.id === selectedWorkspaceId,
                )}
                {#if currentWorkspace}
                  <IconRenderer
                    icon={currentWorkspace.icon}
                    class="size-4 shrink-0"
                  />
                {/if}
              {/if}
              {selectedWorkspaceName}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupHeading>Workspaces</Select.GroupHeading>
              {#each workspaces as ws (ws.id)}
                <Select.Item
                  value={ws.id}
                  label={ws.name}
                  onclick={() => {
                    selectedWorkspaceId = ws.id;
                  }}
                >
                  <div class="flex items-center gap-2">
                    <IconRenderer icon={ws.icon} class="size-4 shrink-0" />
                    <span>{ws.name}</span>
                  </div>
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Parent Note Selection -->
      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium">Parent Note</span>
        <Select.Root type="single">
          <Select.Trigger class="w-full flex items-center justify-between">
            <span class="truncate flex items-center gap-2">
              {#if selectedParentNoteId !== null}
                {@const parentNote = allowedParents.find(
                  (n) => n.id === selectedParentNoteId,
                )}
                {#if parentNote}
                  <IconRenderer
                    icon={parentNote.icon}
                    class="size-4 shrink-0"
                  />
                {/if}
              {/if}
              {selectedParentNoteName}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupHeading>Notes</Select.GroupHeading>
              <Select.Item
                value="root"
                label="None (Root Note)"
                onclick={() => {
                  selectedParentNoteId = null;
                }}
              >
                <div class="flex items-center gap-2 font-medium">
                  <icons.Folder class="size-4 shrink-0" />
                  <span>None (Root Note)</span>
                </div>
              </Select.Item>
              {#each allowedParents as pNote (pNote.id)}
                <Select.Item
                  value={pNote.id}
                  label={pNote.name}
                  onclick={() => {
                    selectedParentNoteId = pNote.id;
                  }}
                >
                  <div class="flex items-center gap-2">
                    <IconRenderer icon={pNote.icon} class="size-4 shrink-0" />
                    <span>{pNote.name}</span>
                  </div>
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button onclick={handleMove} disabled={loading}>
        {#if loading}
          <BarSpinner class="mr-2" />
        {/if}
        Move Note
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
