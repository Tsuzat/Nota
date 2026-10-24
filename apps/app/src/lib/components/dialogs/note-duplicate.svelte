<script lang="ts" module>
import type { NoteMeta } from "#lib/data/types.ts";

let open = $state(false);
let note = $state<NoteMeta | null>(null);

export const openNoteDuplicate = (target: NoteMeta) => {
	note = target;
	open = true;
};
</script>

<script lang="ts">
import { toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.ts";
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
let isLoading = $state(false);

$effect(() => {
	if (open && note) {
		name = `${note.name} (copy)`;
		isLoading = false;
	}
});

const handleDuplicate = async () => {
	if (!note || !name.trim() || isLoading) return;

	const source = note;
	isLoading = true;
	try {
		await notesCtx.duplicate(source, name.trim());
		toast.success("Note duplicated");
		open = false;
	} catch (err) {
		console.error(err);
		toast.error(
			err instanceof Error ? err.message : "Failed to duplicate note",
		);
	} finally {
		isLoading = false;
	}
};
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only">Open</DialogTrigger>
  <DialogContent class="sm:max-w-100">
    <DialogHeader>
      <DialogTitle>Duplicate note</DialogTitle>
      <DialogDescription>
        Enter a name for the duplicate. A copy of this note and its content will
        be created.
      </DialogDescription>
    </DialogHeader>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleDuplicate();
      }}
      class="flex flex-col gap-5 pt-1"
    >
      <Input bind:value={name} placeholder="Note name" required autofocus />

      <DialogFooter>
        <Button type="button" variant="ghost" onclick={() => (open = false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || isLoading}>
          {#if isLoading}
            <BarSpinner class="mr-1.5 size-4" />
            Duplicating…
          {:else}
            Duplicate
          {/if}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
