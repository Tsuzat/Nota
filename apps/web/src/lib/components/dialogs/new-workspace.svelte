<script lang="ts" module>
let open = $state(false);

export const openNewWorkspace = () => {
  open = true;
};
</script>

<script lang="ts">
  import { toast } from "@nota/ui/shadcn/sonner";
  import { getAuthContext, getWorkspacesContext } from "@nota/client";
  import {
    BarSpinner,
    IconPicker,
    IconRenderer,
    icons,
  } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import * as Dialog from "@nota/ui/shadcn/dialog";
  import { Input } from "@nota/ui/shadcn/input";

  let name: string | undefined = $state<string>();
  let icon: string = $state("emoji:📂");

  let loading = $state(false);

  const cloudWorkspaces = getWorkspacesContext();
  const user = $derived(getAuthContext().user);

  const isOverLimit = $derived(
    user?.subscription_plan === "free" &&
      cloudWorkspaces.workspaces.length >= 1,
  );

  const canSubmit = $derived(
    name !== undefined &&
      name.trim() !== "" &&
      icon.trim() !== "" &&
      !loading &&
      !isOverLimit,
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!user) {
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
        <div
          class="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg"
        >
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

    {#if isOverLimit}
      <div
        class="bg-destructive/15 text-destructive border-destructive/30 rounded-md border p-3 text-sm"
      >
        Free users are limited to 1 cloud workspace. Please upgrade to Pro for
        unlimited workspaces.
      </div>
    {:else}
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
    {/if}
  </Dialog.Content>
</Dialog.Root>
