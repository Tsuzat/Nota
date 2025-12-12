<script lang="ts">
import { Button } from '@nota/ui/shadcn/button';
import * as Popover from '@nota/ui/shadcn/popover';
import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { type CloudNote, useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
import SimpleTooltip from '@nota/ui/custom/SimpleToolTip.svelte';
import { toast } from '@nota/ui/shadcn/sonner';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';

interface Props {
  open?: boolean;
}

let { open = $bindable(false) }: Props = $props();

const currentUserWorkspace = useCurrentUserWorkspaceContext();

const localNotes = getLocalNotes();
const cloudNotes = useCloudNotes();
const trashedNotes = $derived.by<LocalNote[] | CloudNote[]>(() => {
  if (currentUserWorkspace.getIsLocal()) return localNotes.getNotes().filter((n) => n.trashed);
  else return cloudNotes.getTrashedNotes();
});

async function deleteNote(note: LocalNote | CloudNote) {
  try {
    if ('owner' in note) await cloudNotes.deleteNote(note);
    else await localNotes.deleteNote(note);
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong while deleting ${note.name}`);
  }
}
async function restoreNote(note: LocalNote | CloudNote) {
  try {
    if ('owner' in note) await cloudNotes.restoreFromTrash(note.id);
    else await localNotes.restoreNote(note);
  } catch (error) {
    console.error(error);
    toast.error(`Something went wrong while restoring ${note.name}`);
  }
}
</script>

<Popover.Root bind:open>
	<Popover.Trigger class="sr-only absolute right-0">Open</Popover.Trigger>
	<Popover.Content
		class="flex max-h-80 w-80 flex-col gap-1 overflow-y-auto p-1"
		side="right"
		portalProps={{ disabled: true, to: undefined }}
	>
		{#each trashedNotes as note (note.id)}
			<div class="flex items-center gap-2 rounded-lg p-1.5">
				<IconRenderer icon={note.icon} class="size-4" />
				<div class="flex flex-col">
					<span class="truncate">{note.name}</span>
				</div>
				<div class="ml-auto">
					<SimpleTooltip content="Restore Note">
						<Button
							title="Restore Note"
							variant="ghost"
							onclick={() => restoreNote(note)}
							size="icon-sm"
						>
							<icons.RotateCcw />
						</Button>
					</SimpleTooltip>
					<SimpleTooltip content="Delete Permanently">
						<Button
							title="Delete Permanently"
							variant="ghost"
							onclick={() => deleteNote(note)}
							size="icon-sm"
						>
							<icons.Trash2 />
						</Button>
					</SimpleTooltip>
				</div>
			</div>
		{/each}
		{#if trashedNotes.length === 0}
			<div class="p-2 text-center">No trashed notes</div>
		{/if}
	</Popover.Content>
</Popover.Root>
