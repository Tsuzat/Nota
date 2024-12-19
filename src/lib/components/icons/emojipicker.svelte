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
	import Input from '../ui/input/input.svelte';

	interface Props {
		searchTerm?: string;
		onSelect: (emoji: string) => void;
	}

	let emojis: Emojis = $state(emojisRaw);
	let categories = Object.keys(emojis);
	let selectedCatergory = $state(categories[0]);
	let skinTone = $state('default');

	const skinTones: Record<string, string> = {
		default: '✋',
		'light skin tone': '✋🏻',
		'dark skin tone': '✋🏿',
		'medium-dark skin tone': '✋🏾',
		'medium-light skin tone': '✋🏼',
		'medium skin tone': '✋🏽'
	};

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

	function applyFilters(emojis: EmojiItem[], searchTerm: string, skinTone: string): EmojiItem[] {
		let updatedEmojis: EmojiItem[] = [];
		// Remove all the emojis which does not have skin tones
		switch (skinTone) {
			case 'default':
				updatedEmojis = emojis.filter((emoji) => !emoji.name.includes('skin tone'));
				break;
			default:
				updatedEmojis = emojis.filter((emoji) => emoji.name.includes(skinTone));
		}
		// Search terms to be searched
		if (searchTerm !== '') {
			updatedEmojis = updatedEmojis.filter((emoji) => emoji.name.includes(searchTerm));
		}
		return updatedEmojis;
	}
</script>

<Tabs.Root bind:value={selectedCatergory} class="w-96 flex flex-col-reverse">
	<Tabs.List class="w-96 flex items-center justify-evenly p-1 rounded-none border-t">
		{#each categories as catergory}
			<Tooltip text={catergory}>
				<Tabs.Trigger value={catergory} class="text-[1.25rem] p-1">
					{categoriesEmojis[catergory]}
				</Tabs.Trigger>
			</Tooltip>
		{/each}
	</Tabs.List>
	<!-- {#each categories as catergory} -->
	<Tabs.Content value={selectedCatergory} class="h-96 w-96 p-1 overflow-auto">
		<div class="flex flex-wrap gap-1">
			{#each applyFilters(emojis[selectedCatergory], searchTerm, skinTone) as emoji}
				<Tooltip text={emoji.name}>
					<Button
						variant="ghost"
						class="size-8 text-xl p-1"
						onclick={() => {
							onSelect(emoji.emoji);
						}}
					>
						{emoji.emoji}
					</Button>
				</Tooltip>
			{/each}
		</div>
	</Tabs.Content>
	<!-- {/each} -->
	<div>
		<Input bind:value={searchTerm} placeholder="Search Emojies..." />
	</div>
</Tabs.Root>
