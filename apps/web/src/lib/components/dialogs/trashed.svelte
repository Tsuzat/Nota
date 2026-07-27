<script lang="ts">
import { getNotesContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Popover from '@nota/ui/shadcn/popover';
import { toast } from '@nota/ui/shadcn/sonner';

interface Props {
  open?: boolean;
}

let { open = $bindable(false) }: Props = $props();

const cloudNotes = getNotesContext();

const trashedNotes = $derived.by<Note[]>(() => {
  return cloudNotes.notes.filter((n) => n.deleted_at);
});

async function deleteNote(note: Note) {
  try {
    const confirm = window.confirm(
      `Are you sure you want to delete ${note.name} permanently? This action cannot be undone.`
    );
    if (!confirm) return;
    await cloudNotes.delete(note.id);
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong while deleting ${note.name}`);
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
