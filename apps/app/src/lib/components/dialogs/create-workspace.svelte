<script lang="ts" module>
let open = $state(false);

export const openCreateWorkspace = () => {
	open = true;
};
</script>

<script lang="ts">
  import { buttonVariants, Button } from "@nota/ui/shadcn/button/index.ts";
  import {} from "@nota/ui";
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@nota/ui/shadcn/dialog/index.ts";

  import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
  import { Input } from "@nota/ui/shadcn/input/index.js";
  import { ISDESKTOP } from "#lib/utils.ts";
  import { fade } from "svelte/transition";
  import { BarSpinner } from "@nota/ui/icons/index.ts";
  const workspaceCxt = getWorkspaceContext();
  let isLocal = $state(ISDESKTOP);
  let name = $state("");
  let isLoading = $state(false);
  let err = $state<string>();

  const handleSubmit = async () => {
    isLoading = true;
    try {
      if (isLocal) {
        await workspaceCxt.local.insert({ icon: "📁", name });
      } else {
      }
      open = false;
    } catch (e) {
      err = e instanceof Error ? e.message : "An error occurred";
    } finally {
      isLoading = false;
    }
  };
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only">Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create new workspace</DialogTitle>
      <DialogDescription>
        Create new workspace for your system.
      </DialogDescription>
    </DialogHeader>
    <form onsubmit={handleSubmit}>
      <div class="flex flex-col space-y-4">
        <div class="flex items-center w-full">
          <Input
            class="w-full"
            placeholder="Workspace name..."
            bind:value={name}
            required
          />
        </div>
      </div>
      <DialogFooter>
        {#if err}
          <small transition:fade class="text-red-500">{err}</small>
        {/if}
        <DialogClose class={buttonVariants({ variant: "outline" })}
          >Cancel</DialogClose
        >
        <Button type="submit">
          {#if isLoading}
            <BarSpinner />
          {/if}
          Create</Button
        >
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
