<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Command from '$lib/components/ui/command';
	import { NOTES, OPEN_COMMAND_BAR, WORKSPACES } from '$lib/contants';
	import type { NotesDB } from '$lib/database/notes';
	import type { WorkSpaceDB } from '$lib/database/workspace';
	import { Home } from 'lucide-svelte';

	function getWorkSpace(note: NotesDB): WorkSpaceDB | undefined {
		return $WORKSPACES.find((w) => w.id === note.workspace);
	}

	function handleGoto(path: string) {
		goto(path);
		OPEN_COMMAND_BAR.set(false);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			OPEN_COMMAND_BAR.update((v) => !v);
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open={$OPEN_COMMAND_BAR} class="p-2">
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Item value="home" keywords={['home', '/', 'homepage']} onclick={() => handleGoto('/')}>
			<Home />
			<span>Home</span>
		</Command.Item>
		<Command.Group heading="All Notes">
			{#each $NOTES as notes (notes.id)}
				{@const workspace = getWorkSpace(notes)}
				<Command.Item
					value={notes.id}
					class="flex items-center w-full"
					keywords={[notes.name, workspace?.name || '']}
					onclick={() => handleGoto(`/${notes.id}`)}
				>
					<div class="text-ellipsis w-[50%]">{notes.icon} {notes.name}</div>
					{#if workspace}
						<div class="text-xs text-muted-foreground text-ellipsis">
							{workspace.icon}
							{workspace.name}
						</div>
					{/if}
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
	<div class="text-xs border-t py-1 text-center inline-flex justify-between">
		<span class="text-muted-foreground"> <span class="key">
			
		</span> select</span>
		<span class="text-muted-foreground"> <span class="key">↑↓</span> navigate</span>
	</div>
</Command.Dialog>

<style>
	.key {
		@apply bg-muted/50 rounded-sm p-0.5;
	}
</style>
