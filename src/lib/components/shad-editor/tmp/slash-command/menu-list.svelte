<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { icons } from 'lucide-svelte';

	interface Props {
		props: Record<string, any>;
	}

	const { props }: Props = $props();

	let scrollContainer = $state<HTMLElement | null>(null);
	let activeItem = $state<HTMLButtonElement | null>(null);

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
		if (selectedCommandIndex && selectedGroupIndex)
			if (activeItem !== null && scrollContainer !== null) {
				const offsetTop = activeItem.offsetTop;
				const offsetHeight = activeItem.offsetHeight;
				console.log(offsetTop, offsetHeight);
				scrollContainer.scrollTop = offsetTop - offsetHeight;
			}
	});

	const selectItem = (groupIndex: number, commandIndex: number) => {
		const cmd = items[groupIndex].commands[commandIndex];
		cmd.action(editor);
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

<div
	bind:this={scrollContainer}
	class="rounded bg-background/90 backdrop-blur-md p-2 w-48 border max-h-[min(80vh,24rem)] overflow-auto flex-wrap mb-8"
>
	{#each items as grp, groupIndex}
		<span class="text-sm font-medium text-muted-foreground">{grp.title}</span>

		{#each grp.commands as command, commandIndex}
			{@const Icon = icons[command.iconName]}
			<Button
				bind:ref={activeItem}
				variant="ghost"
				class={cn(
					'w-full items-center justify-start gap-2 p-1.5 h-fit',
					selectedGroupIndex === groupIndex && selectedCommandIndex === commandIndex
						? 'bg-muted'
						: ''
				)}
				onclick={() => command.action(editor)}
			>
				<Icon />
				<span>{command.label}</span>
			</Button>
		{/each}
	{/each}
</div>
