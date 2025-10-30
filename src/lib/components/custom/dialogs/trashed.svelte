<script lang="ts">
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { type CloudNote, useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
	import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
	import { toast } from 'svelte-sonner';
	import SimpleTooltip from '../simple-tooltip.svelte';

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
			if ('owner' in note) await cloudNotes.deleteNote(note.id);
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
							class="!size-7"
						>
							<RotateCcw />
						</Button>
					</SimpleTooltip>
					<SimpleTooltip content="Delete Permanently">
						<Button
							title="Delete Permanently"
							variant="ghost"
							onclick={() => deleteNote(note)}
							class="!size-7"
						>
							<Trash2Icon />
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
