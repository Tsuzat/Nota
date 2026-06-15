<script lang="ts" module>
  import type { LocalNote } from "$lib/local/notes.svelte";
  import type { Note } from "@nota/client";

  let open = $state(false);
  let noteToRename = $state<LocalNote | Note | null>(null);

  export const openRenameNote = (note: LocalNote | Note) => {
    open = true;
    noteToRename = note;
  };
</script>

<script lang="ts">
  import { toast } from "@nota/ui/shadcn/sonner";
  import { getNotesContext } from "@nota/client";
  import { getLocalNotes } from "$lib/local/notes.svelte";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import * as Dialog from "@nota/ui/shadcn/dialog";
  import { Input } from "@nota/ui/shadcn/input";
  import { BarSpinner, IconPicker, IconRenderer } from "@nota/ui/icons/index.js";

  let loading = $state(false);
  let name = $state("");
  let icon = $state("lucide:FileText");

  $effect(() => {
    if (noteToRename) {
      name = noteToRename.name;
      icon = noteToRename.icon;
    }
  });

  const localNotes = getLocalNotes();
  const cloudNotes = getNotesContext();
  const isCloud = $derived(noteToRename ? "owner" in noteToRename : false);

  async function handleRename(e: Event) {
    e.preventDefault();
    if (!noteToRename) return;
    if (!name || name.trim() === "" || !icon || icon.trim() === "") {
      toast.error("Please enter a note name and select an icon");
      return;
    }

    loading = true;
    try {
      if (isCloud) {
        await cloudNotes.update(noteToRename.id, { name, icon });
      } else {
        await localNotes.updateNote({ ...(noteToRename as LocalNote), name, icon });
      }
      open = false;
      toast.success("Note updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update note");
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
      <Dialog.Title>Rename Note</Dialog.Title>
      <Dialog.Description>
        Update the name and icon for <strong>{noteToRename?.name}</strong>.
      </Dialog.Description>
    </Dialog.Header>
    <form onsubmit={handleRename} class="flex flex-col gap-4 py-2">
      <div class="flex w-full items-center gap-2">
        <IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
          <div class={buttonVariants({ variant: "outline", size: "icon" })}>
            <IconRenderer {icon} />
          </div>
        </IconPicker>
        <Input bind:value={name} placeholder="Note Name" required />
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {#if loading}
            <BarSpinner class="mr-2" />
          {/if}
          Update Note
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
