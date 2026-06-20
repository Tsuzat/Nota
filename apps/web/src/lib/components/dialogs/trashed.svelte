<script lang="ts">
import { getNotesContext, type Note } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Popover from '@nota/ui/shadcn/popover';
import { toast } from '@nota/ui/shadcn/sonner';

interface Props {
  open?: boolean;
}

let { open = $bindable(false) }: Props = $props();

const cloudNotes = getNotesContext();
const trashedNotes = $derived(cloudNotes.notes.filter((n) => n.deleted_at));

async function deleteNote(note: Note) {
  const confirmed = confirm(`Are you sure you want to delete ${note.name} permanently? This action cannot be undone.`);
  if (!confirmed) return;
  try {
    await cloudNotes.delete(note.id);
    toast.success(`${note.name} permanently deleted.`);
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong while deleting ${note.name}`);
  }
}

async function restoreNote(note: Note) {
  try {
    await cloudNotes.update(note.id, { deleted_at: null });
    toast.success(`${note.name} restored.`);
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong while restoring ${note.name}`);
  }
}
</script>

<Popover.Root bind:open>
  <Popover.Trigger class="sr-only absolute right-0">Open</Popover.Trigger>
  <Popover.Content
    class="flex max-h-80 w-80 flex-col gap-1 overflow-y-auto p-1 z-50 bg-popover text-popover-foreground border shadow-md rounded-md"
    side="right"
    portalProps={{ disabled: false }}
  >
    {#each trashedNotes as note (note.id)}
      <div class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted/50">
        <IconRenderer icon={note.icon} class="size-4 shrink-0" />
        <span class="truncate text-sm flex-1">{note.name}</span>
        <div class="flex items-center gap-1 shrink-0">
          <Button
            title="Restore Note"
            variant="ghost"
            onclick={() => restoreNote(note)}
            size="icon-sm"
          >
            <icons.RotateCcw class="size-4" />
          </Button>
          <Button
            title="Delete Permanently"
            variant="ghost"
            onclick={() => deleteNote(note)}
            size="icon-sm"
          >
            <icons.Trash2 class="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    {/each}
    {#if trashedNotes.length === 0}
      <div class="p-4 text-center text-xs text-muted-foreground">No trashed notes</div>
    {/if}
  </Popover.Content>
</Popover.Root>
