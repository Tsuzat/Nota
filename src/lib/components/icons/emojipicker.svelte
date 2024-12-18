<script lang="ts" module>
	export interface Emojis {
		[key: string]: EmojiItem[];
	}

	export interface EmojiItem {
		name: string;
		emoji: string;
	}
</script>

<script lang="ts">
	import emojisRaw from '$lib/assets/jsons/emojis.json';
	import Tooltip from '../customs/tooltip.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Button } from '../ui/button';

	interface Props {
		searchTerm?: string;
		onSelect: (emoji: string) => void;
	}

	let emojis: Emojis = $state(emojisRaw);
	let categories = Object.keys(emojis);
	let selectedCatergory = $state(categories[0]);

	const categoriesEmojis: Record<string, string> = {
		'Smileys & Emotion': '🙂',
		Component: '🧩',
		'People & Body': '👨‍👩‍👧‍👦',
		'Animals & Nature': '🐶',
		'Food & Drink': '🍔',
		'Travel & Places': '🌍',
		Activities: '🏃‍♂️',
		Objects: '🚗',
		Symbols: '❤️',
		Flags: '🏳️'
	};

	let { searchTerm = $bindable(''), onSelect }: Props = $props();
</script>

<Tabs.Root bind:value={selectedCatergory}>
	<Tabs.List class="w-96 flex items-center justify-evenly p-1">
		{#each categories as catergory}
			<Tabs.Trigger value={catergory} class="text-[1.25rem] p-1"
				>{categoriesEmojis[catergory]}</Tabs.Trigger
			>
		{/each}
	</Tabs.List>
	{#each categories as catergory}
		<Tabs.Content value={catergory} class="h-96 w-96 p-1 overflow-auto">
			<div class="flex flex-wrap gap-1">
				{#each emojis[catergory] as emoji}
					<Tooltip text={emoji.name}>
						<Button
							variant="ghost"
							class="text-xl p-0"
							onclick={() => {
								console.log('Selected emoji', emoji.emoji);
								onSelect(emoji.emoji);
							}}
						>
							{emoji.emoji}
						</Button>
					</Tooltip>
				{/each}
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>
