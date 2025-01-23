<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { WORKSPACES } from '$lib/contants';
	import type { NotesDB } from '$lib/database/notes';
	import { removeNoteFromRecents } from '$lib/recents';
	import { ExternalLink, Star, Trash2, X } from 'lucide-svelte';
	import Tooltip from '../tooltip.svelte';
	import { cn } from '$lib/utils';
	import IconRender from '$lib/components/icons/icon-render.svelte';

	interface Props {
		note: NotesDB;
	}

	let { note }: Props = $props();

	const workspace = $WORKSPACES.find((w) => w.id === note.workspace);
</script>

<Card.Root class="bg-muted/40 relative hover:bg-muted/60 transition-all cursor-pointer max-w-60">
	<Card.Header class="relative">
		<Card.Title class="text-5xl font-bold">
			<IconRender icon={note.icon} class="size-12" />
		</Card.Title>
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
		{#if workspace}
			<span class="text-ellipsis">
				<IconRender icon={workspace.icon} />
				{workspace.name}
			</span>
		{/if}
	</Card.Content>
	<div class="inline-flex items-center absolute right-1 bottom-1 gap-2">
		<Tooltip text="Trashed Notes" delayDuration={100}>
			<Trash2 class={cn('size-4 text-muted-foreground', !note.trashed && 'hidden')} />
		</Tooltip>
		<Tooltip text="Favorite Notes" delayDuration={100}>
			<Star class={cn('size-4 fill-yellow-500 text-yellow-500', !note.favorite && 'hidden')} />
		</Tooltip>
	</div>
</Card.Root>
