<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { WORKSPACES } from '$lib/contants';
	import type { NotesDB } from '$lib/database/notes';
	import { removeNoteFromRecents } from '$lib/recents';
	import { ExternalLink, X } from 'lucide-svelte';
	import Tooltip from '../tooltip.svelte';

	interface Props {
		note: NotesDB;
	}

	let { note }: Props = $props();

	const workspace = $WORKSPACES.find((w) => w.id === note.workspace);
</script>

<Card.Root class="bg-muted/40 hover:bg-muted/60 transition-all cursor-pointer max-w-60">
	<Card.Header class="relative">
		<Card.Title class="text-5xl font-bold">{note.icon}</Card.Title>
		<Card.Description class="text-foreground text-xl font-medium text-ellipsis"
			>{note.name}</Card.Description
		>

		<Button
			variant="link"
			class="absolute right-1 top-0 p-0 size-4"
			onclick={() => removeNoteFromRecents(note.id)}
		>
			<Tooltip text="Remove from recents" delayDuration={100}>
				<X />
			</Tooltip>
		</Button>
		<Button
			variant="link"
			class="absolute top-0 size-4 p-0 right-8"
			onclick={() => goto(`/${note.id}`)}
		>
			<Tooltip text="Open Notes" delayDuration={100}>
				<ExternalLink />
			</Tooltip>
		</Button>
	</Card.Header>
	<Card.Content class="text-sm text-muted-foreground" title={note.path}>
		<span class="text-ellipsis">{workspace?.icon} {workspace?.name}</span>
	</Card.Content>
</Card.Root>
