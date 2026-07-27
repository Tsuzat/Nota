<script lang="ts">
import { getNotesContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Popover from '@nota/ui/shadcn/popover';
import { toast } from '@nota/ui/shadcn/sonner';

import * as Dialog from '@nota/ui/shadcn/dialog';

interface Props {
  open?: boolean;
}

let { open = $bindable(false) }: Props = $props();

const cloudNotes = getNotesContext();

const trashedNotes = $derived.by<Note[]>(() => {
  return cloudNotes.notes.filter((n) => n.deleted_at);
});

let noteToDelete = $state<Note | null>(null);
let isDeleting = $state(false);

function deleteNote(note: Note) {
  noteToDelete = note;
}

async function confirmDelete() {
  if (!noteToDelete) return;
  isDeleting = true;
  try {
    await cloudNotes.delete(noteToDelete.id);
    noteToDelete = null;
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong while deleting ${noteToDelete?.name}`);
  } finally {
    isDeleting = false;
  }
}

async function restoreNote(note: Note) {
  try {
    await cloudNotes.update(note.id, { deleted_at: null });
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong while restoring ${note.name}`);
  }
}
</script>

<Popover.Root bind:open>
  <Popover.Trigger class="sr-only absolute right-0">Open</Popover.Trigger>
  <Popover.Content
    class="flex max-h-80 w-80 flex-col gap-1 overflow-y-auto p-1"
    side="right"
    portalProps={{ disabled: true, to: undefined }}
  >
    {#each trashedNotes as note (note.id)}
      <div class="flex items-center gap-2 rounded-lg p-1.5">
        <IconRenderer icon={note.icon} class="size-4" />
        <div class="flex flex-col">
          <span class="truncate">{note.name}</span>
        </div>
        <div class="ml-auto">
          <SimpleToolTip content="Restore Note">
            <Button
              title="Restore Note"
              variant="ghost"
              onclick={() => restoreNote(note)}
              size="icon-sm"
            >
              <icons.RotateCcw />
            </Button>
          </SimpleToolTip>
          <SimpleToolTip content="Delete Permanently">
            <Button
              title="Delete Permanently"
              variant="ghost"
              onclick={() => deleteNote(note)}
              size="icon-sm"
            >
              <icons.Trash2 />
            </Button>
          </SimpleToolTip>
        </div>
      </div>
    {/each}
    {#if trashedNotes.length === 0}
      <div class="p-2 text-center">No trashed notes</div>
    {/if}
  </Popover.Content>
</Popover.Root>

<Dialog.Root
  open={!!noteToDelete}
  onOpenChange={(v) => !v && (noteToDelete = null)}
>
  <Dialog.Content class="sm:max-w-100">
    <Dialog.Header>
      <Dialog.Title>Delete Note</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete <strong>{noteToDelete?.name}</strong> permanently?
        This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="mt-4 gap-2 sm:gap-0">
      <Button
        variant="outline"
        onclick={() => (noteToDelete = null)}
        disabled={isDeleting}>Cancel</Button
      >
      <Button
        variant="destructive"
        onclick={confirmDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete Permanently"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
