<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import { NOTES, OPEN_COMMAND_BAR } from '$lib/contants';

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			OPEN_COMMAND_BAR.set(!$OPEN_COMMAND_BAR);
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open={$OPEN_COMMAND_BAR}>
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="All Notes">
			{#each $NOTES as notes (notes.id)}
				<Command.Item value={notes.id} keywords={[notes.name]} onclick={() => goto(`/${notes.id}`)}>
					<div>{notes.icon}</div>
					<span>{notes.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
