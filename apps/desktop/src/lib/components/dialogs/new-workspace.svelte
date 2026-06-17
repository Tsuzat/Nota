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
  import { getLocalWorkspaces } from "$lib/local/workspaces.svelte";
  import { Switch } from "@nota/ui/shadcn/switch";
  import { Label } from "@nota/ui/shadcn/label";

  let name: string | undefined = $state<string>();
  let icon: string = $state("emoji:📂");

  let loading = $state(false);

  const localWorkspaces = getLocalWorkspaces();
  const cloudWorkspaces = getWorkspacesContext();
  const user = $derived(getAuthContext().user);
  let isLocal = $state(true);

  const canSubmit = $derived(
    name !== undefined && name.trim() !== "" && icon.trim() !== "" && !loading
  );

  async function createLocalWorkspace() {
    if (!icon || !name) {
      toast.error("Please select an icon and name");
      return;
    }
    try {
      loading = true;
      await localWorkspaces.createWorkspace(icon, name);
      open = false;
      name = "";
      icon = "emoji:📂";
    } catch (e) {
      loading = false;
      console.error(e);
      toast.error("Could not create workspace");
      return;
    } finally {
      loading = false;
    }
  }

  async function createCloudWorkspace() {
    if (user === null) {
      toast.error("No user found. Please login again.");
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
      toast.error("Something went wrong.");
    } finally {
      loading = false;
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (isLocal) {
      await createLocalWorkspace();
    } else {
      await createCloudWorkspace();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "w") {
      event.preventDefault();
      open = true;
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
            {#if isLocal}
              Create a local workspace stored on this device
            {:else}
              Create a cloud workspace synced across devices
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
        <Input
          bind:value={name}
          placeholder="Workspace Name"
          type="text"
          required
          autofocus
        />
      </div>

      <!-- Storage type toggle -->
      {#if user}
        <div class="bg-muted/40 flex items-center justify-between rounded-lg p-3">
          <div class="flex items-center gap-2">
            {#if isLocal}
              <icons.HardDrive class="text-muted-foreground size-4" />
            {:else}
              <icons.Cloud class="text-muted-foreground size-4" />
            {/if}
            <Label for="storage-toggle" class="text-sm font-medium">
              {isLocal ? "Local" : "Cloud"} Workspace
            </Label>
          </div>
          <Switch id="storage-toggle" bind:checked={isLocal} />
        </div>
      {/if}

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
          Create Workspace
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
