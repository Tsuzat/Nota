<script lang="ts" module>
let open = $state(false);

export const openNewWorkspace = () => {
  open = true;
};
</script>

<script lang="ts">
  import { toast } from "@nota/ui/shadcn/sonner";
  import { getAuthContext, getWorkspacesContext } from "@nota/client";
  import { BarSpinner, IconPicker, IconRenderer, icons } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import * as Dialog from "@nota/ui/shadcn/dialog";
  import { Input } from "@nota/ui/shadcn/input";

  let name: string | undefined = $state<string>();
  let icon: string = $state("emoji:📂");
  let loading = $state(false);

  const cloudWorkspaces = getWorkspacesContext();
  const user = $derived(getAuthContext().user);

  const canSubmit = $derived(
    name !== undefined && name.trim() !== "" && icon.trim() !== "" && !loading
  );

  async function createCloudWorkspace() {
    if (user === null) {
      toast.error("Please login to create a workspace.");
      return;
    }
    if (!icon || !name || name.trim() === "") {
      toast.error("Please provide an icon and name");
      return;
    }
    try {
      loading = true;
      await cloudWorkspaces.create(name, icon);
      open = false;
      name = "";
      icon = "emoji:📂";
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong when creating workspace.");
    } finally {
      loading = false;
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    await createCloudWorkspace();
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
  <Dialog.Trigger class="sr-only">open</Dialog.Trigger>

  <Dialog.Content class="max-w-md gap-5" showCloseButton={true}>
    <Dialog.Header>
      <div class="flex items-center gap-3">
        <div class="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <icons.FolderPlus class="text-primary size-4" />
        </div>
        <div>
          <Dialog.Title class="text-base">New Workspace</Dialog.Title>
          <Dialog.Description class="text-muted-foreground text-xs">
            Create a cloud workspace synced across devices
          </Dialog.Description>
        </div>
      </div>
    </Dialog.Header>

    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <div class="flex w-full items-center gap-2">
        <IconPicker {icon} side="right" onSelect={(ic: string) => (icon = ic)}>
          <div class={buttonVariants({ variant: "outline", size: "icon" })}>
            <IconRenderer {icon} />
          </div>
        </IconPicker>
        <Input
          bind:value={name}
          placeholder="Workspace Name"
          type="text"
          required
          autofocus
        />
      </div>

      <Dialog.Footer>
        <Dialog.Close>
          <Button variant="outline">Cancel</Button>
        </Dialog.Close>
        <Button type="submit" disabled={!canSubmit}>
          {#if loading}
            <BarSpinner />
          {/if}
          Create Workspace
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
