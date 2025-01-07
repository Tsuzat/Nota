<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import { NOTES, OPEN_COMMAND_BAR } from '$lib/contants';
	import { Home } from 'lucide-svelte';

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			OPEN_COMMAND_BAR.set(!$OPEN_COMMAND_BAR);
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open={$OPEN_COMMAND_BAR} class="p-2">
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Item value="home" keywords={['home', '/', 'homepage']} onclick={() => goto('/')}>
			<Home />
			<span>Home</span>
		</Command.Item>
		<Command.Group heading="All Notes">
			{#each $NOTES as notes (notes.id)}
				<Command.Item value={notes.id} keywords={[notes.name]} onclick={() => goto(`/${notes.id}`)}>
					<div>{notes.icon}</div>
					<span>{notes.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
	<div class="text-sm border-t py-1 text-center inline-flex justify-between">
		<span class="text-muted-foreground"> <span class="key">↵</span> to select</span>
		<span class="text-muted-foreground">
			<span class="key">↑</span> and <span class="key">↓</span> to navigate</span
		>
	</div>
</Command.Dialog>

<style>
	.key {
		@apply bg-muted rounded-sm py-0.5 px-1;
	}
</style>
