<script lang="ts" module>
let open = $state(false);
let parentNoteId = $state<string>();

export const openCreateNotes = (pNoteId?: string) => {
	open = true;
	parentNoteId = pNoteId;
};
</script>

<script lang="ts">
  import AlertCircle from "@lucide/svelte/icons/alert-circle";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Star from "@lucide/svelte/icons/star";
  import { SimpleToolTip, toast } from "@nota/ui";
  import { BarSpinner, IconPicker, IconsRenderer } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.ts";
  import {
    Dialog,
    DialogContent,
    DialogFooter,
  } from "@nota/ui/shadcn/dialog/index.ts";
  import { cn } from "@nota/ui/utils";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { slide } from "svelte/transition";
  import { getUserQuota, isSignedIn } from "#lib/auth-session.svelte.ts";
  import { getNotesContext } from "#lib/data/notes.svelte.ts";
  import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
  import { ISDESKTOP } from "#lib/utils.ts";
  import { PUBLIC_NOTA_URL } from "$app/env/public";

  let title = $state("");
  let description = $state("");
  let isStarred = $state(false);
  let selectedIcon = $state("lucide:file-text");
  let isLoading = $state(false);
  let err = $state<string>();

  const workspaceCtx = getWorkspaceContext();
  const notesCtx = getNotesContext();
  const userQuota = getUserQuota();

  const currentWorkspace = $derived(workspaceCtx.current);
  const isCloud = $derived(!currentWorkspace || "ownerId" in currentWorkspace);
  const signedIn = $derived(isSignedIn());
  const isPro = $derived(userQuota.data?.planTier === "pro");

  // Count active notes in the current workspace
  const notesCount = $derived(
    notesCtx.list.filter((n) => !n.trashedAt).length,
  );

  // Cloud limit: Free users can create at most 10 cloud notes
  const isCloudLimitReached = $derived(
    isCloud && !isPro && notesCount >= 10,
  );
  const isCloudUnauthenticated = $derived(isCloud && !signedIn);
  const isSubmitDisabled = $derived(
    !title.trim() || isCloudLimitReached || isCloudUnauthenticated || isLoading,
  );

  const resetForm = () => {
    title = "";
    description = "";
    isStarred = false;
    selectedIcon = "lucide:file-text";
    err = undefined;
    parentNoteId = undefined;
  };

  const handleCreate = async () => {
    if (!title.trim() || isSubmitDisabled) return;

    isLoading = true;
    err = undefined;

    try {
      await notesCtx.create({
        icon: selectedIcon,
        name: title.trim(),
        description: description.trim() || null,
        parentNoteId: parentNoteId || null,
        starred: isStarred,
      });
      open = false;
      resetForm();
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Failed to create note";
      err = msg;
      toast.error(msg);
    } finally {
      isLoading = false;
    }
  };
</script>

<Dialog
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) resetForm();
  }}
>
  <DialogContent
    showCloseButton={false}
    class="bg-popover/50 backdrop-blur-lg shadow-2xl"
  >
    <div class="flex flex-col gap-4 p-6">
      <!-- Header Area: Icon Picker and Star Toggle -->
      <div class="flex items-center justify-between">
        <IconPicker
          bind:icon={selectedIcon}
          onSelect={(icon) => {
            selectedIcon = icon;
          }}
        >
          <SimpleToolTip content="Pick Icon">
            <span
              class={buttonVariants({
                variant: "ghost",
                class: "size-12 p-2",
              })}
            >
              <IconsRenderer icon={selectedIcon} class="size-6" />
            </span>
          </SimpleToolTip>
        </IconPicker>

        <SimpleToolTip content="Star this note">
          <Button
            variant="ghost"
            size="icon"
            class={cn(
              isStarred
                ? "text-yellow-400 hover:text-yellow-500 hover:bg-yellow-400/10"
                : "text-muted-foreground",
            )}
            onclick={() => (isStarred = !isStarred)}
          >
            <Star class={cn("size-5", isStarred && "fill-current")} />
          </Button>
        </SimpleToolTip>
      </div>

      <!-- Cloud Note Limit Banner for Free Users -->
      {#if isCloudLimitReached}
        <div
          transition:slide
          class="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400"
        >
          <Sparkles class="size-4 shrink-0 mt-0.5 text-amber-500" />
          <div class="space-y-1 text-xs leading-relaxed flex-1">
            <span class="font-semibold">Cloud Note Limit (10 / 10)</span>
            <p class="text-muted-foreground">
              Free plan allows maximum 10 cloud notes. Upgrade to Pro for
              unlimited cloud notes{#if ISDESKTOP}, or switch to a <strong class="text-foreground">Local Workspace</strong>{/if}.
            </p>
            <Button
              size="xs"
              variant="outline"
              class="mt-1 gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-500/15 dark:text-amber-400 font-medium"
              onclick={() => openUrl(`${PUBLIC_NOTA_URL}#pricing`)}
            >
              <Sparkles class="size-3 text-amber-500" />
              <span>Upgrade to Pro</span>
            </Button>
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
            <p class="text-muted-foreground">
              Please sign in to create cloud notes{#if ISDESKTOP}, or switch to a Local Workspace{/if}.
            </p>
          </div>
        </div>
      {/if}

      <!-- Inputs Area -->
      <div class="flex flex-col gap-2">
        <input
          type="text"
          bind:value={title}
          placeholder="Note Title"
          class="w-full border-none bg-transparent text-3xl font-bold tracking-tight text-foreground shadow-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50"
          onkeydown={(e) => {
            if (e.key === "Enter" && !isSubmitDisabled) {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <textarea
          bind:value={description}
          placeholder="What's this note about? (Optional)"
          class="w-full resize-none border-none bg-transparent text-base text-muted-foreground shadow-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 min-h-[80px]"
          onkeydown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isSubmitDisabled) {
              e.preventDefault();
              handleCreate();
            }
          }}
        ></textarea>
      </div>
    </div>

    <!-- Footer Area -->
    <DialogFooter>
      {#if err}
        <small transition:slide class="text-red-500 self-center mr-auto text-xs px-6 pb-2 sm:pb-0">
          {err}
        </small>
      {/if}
      <Button
        variant="ghost"
        class="text-muted-foreground hover:text-foreground"
        onclick={() => (open = false)}
      >
        Cancel
      </Button>
      <Button
        onclick={handleCreate}
        disabled={isSubmitDisabled}
        class="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {#if isLoading}
          <BarSpinner />
          Creating...
        {:else}
          Create Note
        {/if}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
