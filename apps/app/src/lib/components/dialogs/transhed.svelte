<script lang="ts" module>
let open = $state(false);
export const openTrash = () => {
	open = true;
};
</script>

<script lang="ts">
  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogFooter,
    DialogClose,
    DialogTitle,
  } from "@nota/ui/shadcn/dialog/index.ts";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.ts";
  import { getNotesContext } from "#lib/data/notes.svelte.ts";
  import { openDeleteConfirmation } from "@nota/ui/custom/dialogs/confirm-delete.svelte";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import { IconsRenderer } from "@nota/ui/icons/index.js";

  const notesCtx = getNotesContext();
  const trashedNotes = $derived(notesCtx.list.filter((note) => note.trashedAt));

  async function handleRestore(note: any) {
    try {
      await notesCtx.updateMeta(note.id, { trashedAt: null });
    } catch (e) {
      console.error(e);
    }
  }

  function handleDelete(note: any) {
    openDeleteConfirmation({
      title: "Delete Permanently",
      description: `Are you sure you want to permanently delete "${note.name}"? This action cannot be undone.`,
      buttonText: "Delete Permanently",
      onClick: async () => {
        await notesCtx.delete(note.id);
      },
    });
  }
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only"></DialogTrigger>
  <DialogContent class="sm:max-w-125">
    <DialogHeader>
      <DialogTitle class="text-xl font-semibold">Trash</DialogTitle>
      <DialogDescription>
        Manage your trashed notes. These will be deleted in 30 days
        automatically.
      </DialogDescription>
    </DialogHeader>

    <div class="my-2 space-y-3 max-h-[50vh] overflow-y-auto pr-2 -mr-2">
      {#if trashedNotes.length === 0}
        <div
          class="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500"
        >
          <div
            class="bg-muted/50 flex size-16 items-center justify-center rounded-full mb-4"
          >
            <Trash2 class="size-8 text-muted-foreground/50" />
          </div>
          <p class="text-base font-medium text-foreground">
            Your trash is empty
          </p>
          <p class="text-sm text-muted-foreground mt-1">
            Deleted notes will appear here
          </p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each trashedNotes as note (note.id)}
            <div class="group flex items-center justify-between p-3">
              <div class="flex items-center gap-3 overflow-hidden">
                <span
                  class={buttonVariants({
                    variant: "outline",
                    size: "icon-lg",
                  })}
                >
                  <IconsRenderer icon={note.icon ?? "lucide:file-text"} />
                </span>
                <div class="flex flex-col overflow-hidden">
                  <span class="font-medium text-sm truncate"
                    >{note.name || "Untitled Note"}</span
                  >
                  <span class="text-[11px] text-muted-foreground truncate">
                    Deleted {note.trashedAt
                      ? new Date(note.trashedAt).toLocaleDateString()
                      : "recently"}
                  </span>
                </div>
              </div>
              <div
                class="flex items-center gap-1 ml-4 shrink-0"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onclick={() => handleRestore(note)}
                  title="Restore Note"
                >
                  <RotateCcw />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onclick={() => handleDelete(note)}
                  title="Delete Permanently"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <DialogFooter class="sm:justify-between items-center">
      <span class="text-xs text-muted-foreground hidden sm:inline-block">
        {trashedNotes.length}
        {trashedNotes.length === 1 ? "item" : "items"} in trash
      </span>
      <DialogClose class={buttonVariants({ variant: "outline" })}>
        Close
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
