<script lang="ts">
	import Calculator from 'lucide-svelte/icons/calculator';
	import Calendar from 'lucide-svelte/icons/calendar';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Settings from 'lucide-svelte/icons/settings';
	import Smile from 'lucide-svelte/icons/smile';
	import User from 'lucide-svelte/icons/user';
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
				<Command.Item value={notes.id} keywords={[notes.name]}>
					<div>{notes.icon}</div>
					<span>{notes.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Suggestions">
			<Command.Item>
				<Calendar class="mr-2 size-4" />
				<span>Calendar</span>
			</Command.Item>
			<Command.Item>
				<Smile class="mr-2 size-4" />
				<span>Search Emoji</span>
			</Command.Item>
			<Command.Item>
				<Calculator class="mr-2 size-4" />
				<span>Calculator</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Settings">
			<Command.Item>
				<User class="mr-2 size-4" />
				<span>Profile</span>
				<Command.Shortcut>⌘P</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<CreditCard class="mr-2 size-4" />
				<span>Billing</span>
				<Command.Shortcut>⌘B</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<Settings class="mr-2 size-4" />
				<span>Settings</span>
				<Command.Shortcut>⌘S</Command.Shortcut>
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>
