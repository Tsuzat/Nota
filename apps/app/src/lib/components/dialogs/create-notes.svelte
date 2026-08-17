<script lang="ts" module>
let open = $state(false);
let parentNoteId = $state<string>();
export const openCreateNotes = (pNoteId?: string) => {
	open = true;
	parentNoteId = pNoteId;
};
</script>

<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogFooter,
  } from "@nota/ui/shadcn/dialog/index.ts";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.ts";
  import IconPicker from "@nota/ui/icons/icon-picker.svelte";
  import IconsRenderer from "@nota/ui/icons/icons-renderer.svelte";
  import Star from "@lucide/svelte/icons/star";
  import { cn } from "@nota/ui/utils";
  import { SimpleToolTip } from "@nota/ui";
  import { BarSpinner } from "@nota/ui/icons/index.js";
  import { getNotesContext } from "#lib/data/notes.svelte.ts";

  let title = $state("");
  let description = $state("");
  let isStarred = $state(false);
  let selectedIcon = $state("lucide:file-text");
  let isLoading = $state(false);
  const notesCtx = getNotesContext();

  const handleCreate = async () => {
    // Logic to handle note creation
    isLoading = true;
    try {
      await notesCtx.create({
        icon: selectedIcon,
        name: title,
		parentNoteId
      });
      open = false;
      title = "";
      description = "";
      isStarred = false;
      selectedIcon = "lucide:file-text";
    } catch {
    } finally {
      isLoading = false;
    }
  };
</script>

<Dialog bind:open>
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

      <!-- Inputs Area -->
      <div class="flex flex-col gap-2">
        <input
          type="text"
          bind:value={title}
          placeholder="Note Title"
          class="w-full border-none bg-transparent text-3xl font-bold tracking-tight text-foreground shadow-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50"
        />
        <textarea
          bind:value={description}
          placeholder="What's this note about? (Optional)"
          class="w-full resize-none border-none bg-transparent text-base text-muted-foreground shadow-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 min-h-[80px]"
        ></textarea>
      </div>
    </div>

    <!-- Footer Area -->
    <DialogFooter>
      <Button
        variant="ghost"
        class="text-muted-foreground hover:text-foreground"
        onclick={() => (open = false)}
      >
        Cancel
      </Button>
      <Button
        onclick={handleCreate}
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
