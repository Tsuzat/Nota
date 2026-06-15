<script lang="ts" module>
let open = $state(false);

export const openNewWorkspace = () => {
  open = true;
};
</script>

<script lang="ts">
  import { toast } from "@nota/ui/shadcn/sonner";
  import { getAuthContext, getWorkspacesContext } from "@nota/client";
  import { BarSpinner, IconPicker, IconRenderer } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import * as Dialog from "@nota/ui/shadcn/dialog";
  import { Input } from "@nota/ui/shadcn/input";
  import { getLocalWorkspaces } from "$lib/local/workspaces.svelte";
  import { Switch } from "@nota/ui/shadcn/switch";
  import { Label } from "@nota/ui/shadcn/label";

  let name: string | undefined = $state<string>();
  let icon: string = $state("emoji:📂");

  let loading = $state(false);

  const localWorspaces = getLocalWorkspaces();
  const cloudWorkspaces = getWorkspacesContext();
  const user = $derived(getAuthContext().user);
  let isLocal = $state(true);

  async function createLocalWorkspace() {
    // verify icon, name
    if (!icon || !name) {
      toast.error("Please select an icon and name");
      return;
    }
    try {
      loading = true;
      await localWorspaces.createWorkspace(icon, name);
      open = false;
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
    // verify icon, name, dir
    if (!icon || !name || name.trim() === "") {
      toast.error("Please provide an icon and name");
      return;
    }
    try {
      loading = true;
      await cloudWorkspaces.create(name, icon);
      open = false;
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
    if ((event.metaKey || event.ctrlKey) && event.key === "n") {
      event.preventDefault();
      open = true;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
  <Dialog.Trigger class="sr-only">open</Dialog.Trigger>

  <Dialog.Content showCloseButton={true}>
    <Dialog.Header>
      <Dialog.Title>New Workspace</Dialog.Title>
      <Dialog.Description>Create a new workspace</Dialog.Description>
    </Dialog.Header>
    <form onsubmit={handleSubmit} class="flex flex-col gap-2">
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
        />
      </div>
      {#if user}
        <div class="flex items-center gap-2">
          <Switch id="toggle" bind:checked={isLocal} />
          <Label for="toggle">{isLocal ? "Local" : "Cloud"} Workspace</Label>
        </div>
      {/if}
      <Button type="submit">
        {#if loading}
          <BarSpinner />
        {/if}
        Create Workspace
      </Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
