<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { permanentlyDeleteNotes, updateNotesDB, type NotesDB } from '$lib/database/notes';
	import { Trash2, Undo2 } from 'lucide-svelte';
	import Tooltip from '../tooltip.svelte';
	import { updateNOTES } from '$lib/utils';

	interface Props {
		notes: NotesDB;
	}
	let { notes }: Props = $props();
	async function deleteNote() {
		permanentlyDeleteNotes(notes);
	}
	async function restore() {
		notes.trashed = false;
		updateNotesDB(notes);
		updateNOTES(notes);
	}
</script>

<div
	class="p-1 flex items-center text-sm justify-between cursor-pointer hover:bg-muted/50 hover:rounded"
>
	<span>
		<span>{notes.icon}</span>
		<span>{notes.name}</span>
	</span>
	<span>
		<Tooltip text="Restore">
			<Button variant="ghost" class="size-6 p-0 rounded" onclick={restore}>
				<Undo2 />
			</Button>
		</Tooltip>
		<Tooltip text="Delete">
			<Button variant="ghost" class="size-6 p-0 rounded" onclick={deleteNote}>
				<Trash2 />
			</Button>
		</Tooltip>
	</span>
</div>
