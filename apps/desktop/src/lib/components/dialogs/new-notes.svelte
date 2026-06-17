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
    type Workspace,
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
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
  <Dialog.Trigger class="sr-only">
    <span>Open New Notes</span>
  </Dialog.Trigger>
  <Dialog.Content class="w-96" showCloseButton={false}>
    <Dialog.Header>
      <Dialog.Title>New Note</Dialog.Title>
      <Dialog.Description
        >Create a new note for
        <strong>
          {workspace?.name}
        </strong>
      </Dialog.Description>
    </Dialog.Header>
    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <div class="flex w-full items-center gap-2">
        <IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
          <div class={buttonVariants({ variant: "outline", size: "icon" })}>
            <IconRenderer {icon} />
          </div>
        </IconPicker>
        <Input bind:value={name} placeholder="Note Name" type="text" required />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="toggle" bind:checked={isPinned} />
        <Label for="toggle">Pin Note</Label>
      </div>
      <Button type="submit">
        {#if loading}
          <BarSpinner />
        {/if}
        Create Note
      </Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
