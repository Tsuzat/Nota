<script lang="ts">
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { RotateCcw, Trash2Icon } from '@lucide/svelte';
	import SimpleTooltip from '../simple-tooltip.svelte';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	const localNotes = getLocalNotes();
	const trashedNotes = $derived(localNotes.getNotes().filter((n) => n.trashed));
</script>

<Popover.Root bind:open>
	<Popover.Trigger class="sr-only absolute right-0">Open</Popover.Trigger>
	<Popover.Content
		class="flex max-h-80 w-80 flex-col gap-1 overflow-y-auto p-1"
		side="right"
		portalProps={{ disabled: true, to: undefined }}
	>
		{#each trashedNotes as note}
			{@const workspace = getLocalWorkspaces()
				.getWorkspaces()
				.find((w) => w.id === note.workspace)}
			<div class="flex items-center gap-2 rounded-lg p-1.5">
				<IconRenderer icon={note.icon} class="size-4" />
				<div class="flex flex-col">
					<span class="truncate">{note.name}</span>
					<span class="text-muted-foreground truncate text-xs">Workspace: {workspace?.name}</span>
				</div>
				<div class="ml-auto">
					<SimpleTooltip content="Restore Note">
						<Button variant="ghost" onclick={() => localNotes.restoreNote(note)} class="!size-7">
							<RotateCcw />
						</Button>
					</SimpleTooltip>
					<SimpleTooltip content="Delete Note">
						<Button variant="ghost" onclick={() => localNotes.deleteNote(note)} class="!size-7">
							<Trash2Icon />
						</Button>
					</SimpleTooltip>
				</div>
			</div>
		{/each}
	</Popover.Content>
</Popover.Root>
