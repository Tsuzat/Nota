<script lang="ts" module>
import type { NoteMeta } from "#lib/data/types.ts";

let open = $state(false);
let note = $state<NoteMeta | null>(null);

export const openNoteRename = (target: NoteMeta) => {
	note = target;
	open = true;
};
</script>

<script lang="ts">
import { SimpleToolTip, toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import IconPicker from "@nota/ui/icons/icon-picker.svelte";
import IconsRenderer from "@nota/ui/icons/icons-renderer.svelte";
import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.ts";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@nota/ui/shadcn/dialog/index.ts";
import { Input } from "@nota/ui/shadcn/input/index.js";
import { getNotesContext } from "#lib/data/notes.svelte.ts";

const notesCtx = getNotesContext();

let name = $state("");
let icon = $state("lucide:file-text");
let isLoading = $state(false);

$effect(() => {
	if (open && note) {
		name = note.name;
		icon = note.icon ?? "lucide:FileText";
	}
});

const handleSave = async () => {
	if (!note || !name.trim() || isLoading) return;
	isLoading = true;
	try {
		await notesCtx.updateMeta(note.id, { name: name.trim(), icon });
		toast.success("Note renamed");
		open = false;
	} catch {
		toast.error("Failed to rename note");
	} finally {
		isLoading = false;
	}
};
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only">Open</DialogTrigger>
  <DialogContent class="sm:max-w-100">
    <DialogHeader>
      <DialogTitle>Rename note</DialogTitle>
      <DialogDescription>
        Change the name or the icon of your note.
      </DialogDescription>
    </DialogHeader>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      class="flex flex-col gap-5 pt-1"
    >
      <div class="flex items-center gap-3">
        <IconPicker onSelect={(i) => icon = i} side="right" onClose={() => handleSave()}>
          <SimpleToolTip content="Pick icon" side="right">
            <span
              class={buttonVariants({
                variant: "outline",
                size: "icon-lg",
              })}
            >
              <IconsRenderer {icon} class="text-xl" />
            </span>
          </SimpleToolTip>
        </IconPicker>
        <Input
          bind:value={name}
          placeholder="Note name"
          required
          autofocus
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onclick={() => (open = false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || isLoading}>
          {#if isLoading}
            <BarSpinner class="mr-1.5 size-4" />
            Saving…
          {:else}
            Save
          {/if}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
