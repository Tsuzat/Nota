<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { icons } from 'lucide-svelte';

	interface Props {
		props: Record<string, any>;
	}

	const { props }: Props = $props();

	let scrollContainer = $state<HTMLElement | null>(null);
	// let activeItem = $state<HTMLButtonElement | null>(null);

	let selectedGroupIndex = $state<number>(0);
	let selectedCommandIndex = $state<number>(0);

	const items = $derived.by(() => props.items);
	const editor = $derived.by(() => props.editor);

	$effect(() => {
		if (items) {
			selectedGroupIndex = 0;
			selectedCommandIndex = 0;
		}
	});

	$effect(() => {
		const activeItem = document.getElementById(`${selectedGroupIndex}-${selectedCommandIndex}`);
		if (activeItem !== null && scrollContainer !== null) {
			const offsetTop = activeItem.offsetTop;
			const offsetHeight = activeItem.offsetHeight;
			scrollContainer.scrollTop = offsetTop - offsetHeight;
		}
	});

	const selectItem = (groupIndex: number, commandIndex: number) => {
		const command = props.items[groupIndex].commands[commandIndex];
		props.command(command);
	};

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (!props.items.length) {
				return false;
			}
			const commands = props.items[selectedGroupIndex].commands;
			let newCommandIndex = selectedCommandIndex + 1;
			let newGroupIndex = selectedGroupIndex;
			if (commands.length - 1 < newCommandIndex) {
				newCommandIndex = 0;
				newGroupIndex = selectedGroupIndex + 1;
			}

			if (props.items.length - 1 < newGroupIndex) {
				newGroupIndex = 0;
			}
			selectedCommandIndex = newCommandIndex;
			selectedGroupIndex = newGroupIndex;
			return true;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (!props.items.length) {
				return false;
			}
			let newCommandIndex = selectedCommandIndex - 1;
			let newGroupIndex = selectedGroupIndex;
			if (newCommandIndex < 0) {
				newGroupIndex = selectedGroupIndex - 1;
				newCommandIndex = props.items[newGroupIndex]?.commands.length - 1 || 0;
			}
			if (newGroupIndex < 0) {
				newGroupIndex = props.items.length - 1;
				newCommandIndex = props.items[newGroupIndex].commands.length - 1;
			}
			selectedCommandIndex = newCommandIndex;
			selectedGroupIndex = newGroupIndex;
			return true;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			if (!props.items.length || selectedGroupIndex === -1 || selectedCommandIndex === -1) {
				return false;
			}
			selectItem(selectedGroupIndex, selectedCommandIndex);
			return true;
		}
		return false;
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if items.length}
	<div
		bind:this={scrollContainer}
		class="rounded bg-background/90 backdrop-blur-md p-2 w-48 border max-h-[min(80vh,20rem)] overflow-auto flex-wrap mb-8 scroll-smooth"
	>
		{#each items as grp, groupIndex}
			<span
				class="text-sm text-muted-foreground m-2 font-semibold tracking-wider select-none uppercase"
				>{grp.title}</span
			>

			{#each grp.commands as command, commandIndex}
				{@const Icon = icons[command.iconName]}
				{@const isActive =
					selectedGroupIndex === groupIndex && selectedCommandIndex === commandIndex}
				<Button
					variant="ghost"
					id={`${groupIndex}-${commandIndex}`}
					class={cn(
						'w-full items-center justify-start gap-2 p-1.5 h-fit',
						isActive ? 'bg-muted' : ''
					)}
					onclick={() => selectItem(groupIndex, commandIndex)}
				>
					<Icon />
					<span>{command.label}</span>
				</Button>
			{/each}
		{/each}
	</div>
{/if}
