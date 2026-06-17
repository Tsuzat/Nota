<script lang="ts" module>
let open = $state(false);
let parentNoteId = $state<string | null>(null);
export const openNewNote = (pNoteId: string | null = null) => {
  open = true;
  parentNoteId = pNoteId;
};
</script>

<script lang="ts">
  import { toast } from "@lib/components/ui/sonner";
  import {
    getAuthContext,
    getNotesContext, 
  } from "@nota/client";
  import { BarSpinner, IconPicker, IconRenderer, icons } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import { Checkbox } from "@nota/ui/shadcn/checkbox";
  import * as Dialog from "@nota/ui/shadcn/dialog";
  import { Input } from "@nota/ui/shadcn/input";
  import { Label } from "@nota/ui/shadcn/label";
  import { getLocalNotes } from "$lib/local/notes.svelte";
  import { getCurrentWorkspace } from "$lib/currentworkspace.svelte";

  let name: string | undefined = $state<string>();
  let icon: string = $state("lucide:FileText");
  let isPinned = $state(false);

  let loading = $state(false);

  const localNotes = getLocalNotes();
  const cloudNotes = getNotesContext();
  const workspace = $derived(getCurrentWorkspace().get());
  const user = $derived(getAuthContext().user);
  const isCloud = $derived(workspace && "owner" in workspace);

  const canSubmit = $derived(
    name !== undefined && name.trim() !== "" && icon.trim() !== "" && !loading
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!workspace) {
      toast.error("No workspace provided");
      return;
    }
    if (name === undefined || name.trim() === "" || icon.trim() === "") {
      toast.error("Please fill in all the fields");
      return;
    }
    try {
      loading = true;
      if (!("owner" in workspace)) {
        await localNotes.createNote(
          name,
          icon,
          isPinned,
          workspace.id,
          parentNoteId,
        );
      } else {
        if (!user) {
          toast.error(
            "User is not logged in. Please login to create cloud notes",
          );
          return;
        }
        await cloudNotes.create(
          name,
          icon,
          workspace.id,
          parentNoteId,
          isPinned,
        );
      }
      open = false;
      name = "";
      isPinned = false;
      parentNoteId = null;
    } catch (e) {
      loading = false;
      console.error(e);
      toast.error("Could not create notes");
      return;
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "n") {
      open = true
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
  <Dialog.Trigger class="sr-only">
    <span>Open New Notes</span>
  </Dialog.Trigger>
  <Dialog.Content class="max-w-md gap-5" showCloseButton={true}>
    <Dialog.Header>
      <div class="flex items-center gap-3">
        <div class="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <icons.FilePlus class="text-primary size-4" />
        </div>
        <div>
          <Dialog.Title class="text-base">New Note</Dialog.Title>
          <Dialog.Description class="text-muted-foreground text-xs">
            {#if parentNoteId}
              Create a sub-note inside the current note
            {:else if workspace}
              Create a note in <strong class="text-foreground">{workspace.name}</strong>
            {:else}
              Create a new note
            {/if}
          </Dialog.Description>
        </div>
      </div>
    </Dialog.Header>

    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <!-- Icon + Name row -->
      <div class="flex w-full items-center gap-2">
        <IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
          <div class={buttonVariants({ variant: "outline", size: "icon" })}>
            <IconRenderer {icon} />
          </div>
        </IconPicker>
        <Input bind:value={name} placeholder="Note Name" type="text" required autofocus />
      </div>

      <!-- Options -->
      <div class="flex items-center ml-2 justify-between">
        <div class="flex items-center gap-2">
          <Checkbox id="pin-toggle" bind:checked={isPinned} />
          <Label for="pin-toggle" class="text-muted-foreground flex items-center gap-1.5 text-xs">
            <icons.Pin class="size-3" />
            Pin to top
          </Label>
        </div>
        {#if isCloud}
          <span class="text-muted-foreground flex items-center gap-1 text-[10px]">
            <icons.Cloud class="size-3" />
            Cloud
          </span>
        {:else}
          <span class="text-muted-foreground flex items-center gap-1 text-[10px]">
            <icons.HardDrive class="size-3" />
            Local
          </span>
        {/if}
      </div>

      <!-- Footer -->
      <Dialog.Footer>
        <Dialog.Close>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>Cancel</Button>
          {/snippet}
        </Dialog.Close>
        <Button type="submit" disabled={!canSubmit}>
          {#if loading}
            <BarSpinner />
          {/if}
          Create Note
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
