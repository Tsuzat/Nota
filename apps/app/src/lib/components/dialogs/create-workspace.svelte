<script lang="ts" module>
let open = $state(false);

export const openCreateWorkspace = () => {
	open = true;
};
</script>

<script lang="ts">
  import AlertCircle from "@lucide/svelte/icons/alert-circle";
  import Cloud from "@lucide/svelte/icons/cloud";
  import HardDrive from "@lucide/svelte/icons/hard-drive";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import { IconPicker } from "@nota/ui/icons/index.js";
  import { BarSpinner, IconsRenderer } from "@nota/ui/icons/index.ts";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.ts";
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
  import { Input } from "@nota/ui/shadcn/input/index.js";
  import { Label } from "@nota/ui/shadcn/label/index.ts";
  import { Switch } from "@nota/ui/shadcn/switch/index.ts";
  import { slide } from "svelte/transition";
  import { getUserQuota, isSignedIn } from "#lib/auth-session.svelte.ts";
  import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
  import { ISDESKTOP } from "#lib/utils.ts";

  const workspaceCxt = getWorkspaceContext();
  const userQuota = getUserQuota();

  let isLocal = $state(ISDESKTOP);
  let name = $state("");
  let icon = $state("emoji:📁");
  let isLoading = $state(false);
  let err = $state<string>();

  const signedIn = $derived(isSignedIn());
  const isPro = $derived(userQuota.data?.planTier === "pro");
  const cloudWorkspacesCount = $derived(workspaceCxt.cloud.workspaces.length);

  // Cloud limit: Free users can create at most 1 cloud workspace
  const isCloudLimitReached = $derived(
    !isLocal && !isPro && cloudWorkspacesCount >= 1,
  );
  const isCloudUnauthenticated = $derived(!isLocal && !signedIn);
  const isSubmitDisabled = $derived(
    !name.trim() || isCloudLimitReached || isCloudUnauthenticated || isLoading,
  );

  const handleSubmit = async (e?: SubmitEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || isSubmitDisabled) return;

    isLoading = true;
    err = undefined;

    try {
      if (isLocal) {
        await workspaceCxt.local.insert({ icon, name: name.trim() });
      } else {
        await workspaceCxt.cloud.insert({ icon, name: name.trim() });
      }
      open = false;
      name = "";
      icon = "emoji:📁";
      isLocal = ISDESKTOP;
    } catch (e) {
      err = e instanceof Error ? e.message : "An error occurred";
    } finally {
      isLoading = false;
    }
  };
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only">Open</DialogTrigger>
  <DialogContent class="sm:max-w-115">
    <DialogHeader>
      <DialogTitle>Create new workspace</DialogTitle>
      <DialogDescription>
        {isLocal
          ? "Create a local workspace stored only on this device."
          : "Create a cloud workspace synced across your devices."}
      </DialogDescription>
    </DialogHeader>

    <form onsubmit={handleSubmit} class="space-y-4 pt-1">
      <div class="flex flex-col space-y-4">
        <!-- Workspace Name and Icon -->
        <div class="flex items-center gap-2">
          <IconPicker onSelect={(i) => (icon = i)} side="right">
            <Button variant="outline" size="icon">
              <IconsRenderer {icon} class="text-xl" />
            </Button>
          </IconPicker>
          <Input
            class="flex-1"
            placeholder="Workspace name..."
            bind:value={name}
            required
            autofocus
          />
        </div>

        <!-- Desktop Storage Mode Switch -->
        {#if ISDESKTOP}
          <div
            class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3.5"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
              >
                {#if isLocal}
                  <HardDrive class="size-4" />
                {:else}
                  <Cloud class="size-4" />
                {/if}
              </div>
              <div class="space-y-0.5">
                <Label class="text-sm font-medium leading-none cursor-pointer">
                  {isLocal ? "Local Workspace" : "Cloud Workspace"}
                </Label>
                <span class="text-xs text-muted-foreground">
                  {isLocal
                    ? "Stored locally on this computer"
                    : "Synced to your cloud account"}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground font-medium"
                >Cloud</span
              >
              <Switch
                checked={!isLocal}
                onCheckedChange={(checked) => {
                  isLocal = !checked;
                  err = undefined;
                }}
              />
            </div>
          </div>
        {/if}

        <!-- Cloud Workspace Limit Banner for Free Users -->
        {#if isCloudLimitReached}
          <div
            transition:slide
            class="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400"
          >
            <Sparkles class="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div class="space-y-1 text-xs leading-relaxed">
              <span class="font-semibold">Cloud Workspace Limit (1 / 1)</span>
              <span class="text-muted-foreground">
                Free plan allows maximum 1 cloud workspace. Upgrade to Pro for
                unlimited cloud workspaces{#if ISDESKTOP}, or switch to a <strong
                    >Local Workspace</strong
                  >{/if}.
              </span>
            </div>
          </div>
        {:else if isCloudUnauthenticated}
          <div
            transition:slide
            class="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs"
          >
            <AlertCircle class="size-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div class="space-y-0.5 leading-relaxed">
              <span class="font-medium text-foreground">Sign In Required</span>
              <span class="text-muted-foreground">
                Please sign in to create and sync cloud workspaces{#if ISDESKTOP},
                  or create a Local Workspace{/if}.
              </span>
            </div>
          </div>
        {/if}
      </div>

      <DialogFooter class="pt-2">
        {#if err}
          <small
            transition:slide
            class="text-red-500 self-center mr-auto text-xs">{err}</small
          >
        {/if}
        <DialogClose class={buttonVariants({ variant: "outline" })}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          class="font-medium px-5"
        >
          {#if isLoading}
            <BarSpinner class="mr-1.5 size-4" />
          {/if}
          Create Workspace
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
