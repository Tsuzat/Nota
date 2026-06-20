<script lang="ts" module>
let open = $state(false);
let parentNoteId = $state<string | null>(null);
let workspaceId = $state<string | null>(null);

export const openNewNote = (wId: string | null = null, pNoteId: string | null = null) => {
  open = true;
  workspaceId = wId;
  parentNoteId = pNoteId;
};
</script>

<script lang="ts">
  import { toast } from "@nota/ui/shadcn/sonner";
  import { getAuthContext, getNotesContext, getWorkspacesContext } from "@nota/client";
  import { BarSpinner, IconPicker, IconRenderer, icons } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import { Checkbox } from "@nota/ui/shadcn/checkbox";
  import * as Dialog from "@nota/ui/shadcn/dialog";
  import { Input } from "@nota/ui/shadcn/input";
  import { Label } from "@nota/ui/shadcn/label";
  import { page } from "$app/state";

  let name: string | undefined = $state<string>();
  let icon: string = $state("lucide:FileText");
  let isPinned = $state(false);
  let loading = $state(false);

  const cloudNotes = getNotesContext();
  const cloudWorkspaces = getWorkspacesContext();
  const user = $derived(getAuthContext().user);

  const activeWorkspaceId = $derived(workspaceId ?? page.params.id);
  const workspace = $derived(
    cloudWorkspaces.workspaces.find((w) => String(w.id) === String(activeWorkspaceId))
  );

  const canSubmit = $derived(
    name !== undefined && name.trim() !== "" && icon.trim() !== "" && !loading
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!activeWorkspaceId) {
      toast.error("No workspace selected");
      return;
    }
    if (name === undefined || name.trim() === "" || icon.trim() === "") {
      toast.error("Please fill in all the fields");
      return;
    }
    try {
      loading = true;
      if (!user) {
        toast.error("Please login to create a note");
        return;
      }
      await cloudNotes.create(
        name,
        icon,
        activeWorkspaceId,
        parentNoteId,
        isPinned
      );
      open = false;
      name = "";
      isPinned = false;
      parentNoteId = null;
      workspaceId = null;
    } catch (e) {
      loading = false;
      console.error(e);
      toast.error("Could not create note");
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
    <span>Open New Note</span>
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
      <div class="flex w-full items-center gap-2">
        <IconPicker {icon} side="right" onSelect={(ic) => (icon = ic)}>
          <div class={buttonVariants({ variant: "outline", size: "icon" })}>
            <IconRenderer {icon} />
          </div>
        </IconPicker>
        <Input bind:value={name} placeholder="Note Name" type="text" required autofocus />
      </div>

      <div class="flex items-center ml-2 justify-between">
        <div class="flex items-center gap-2">
          <Checkbox id="pin-toggle" bind:checked={isPinned} />
          <Label for="pin-toggle" class="text-muted-foreground flex items-center gap-1.5 text-xs">
            <icons.Pin class="size-3" />
            Pin to top
          </Label>
        </div>
        <span class="text-muted-foreground flex items-center gap-1 text-[10px]">
          <icons.Cloud class="size-3" />
          Cloud
        </span>
      </div>

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
