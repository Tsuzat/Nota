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
	import * as Popover from '$lib/components/ui/popover';
	import { Button, buttonVariants } from '../ui/button';
	import Input from '../ui/input/input.svelte';
	import { Shuffle, X } from 'lucide-svelte';
	//@ts-ignore
	import { debounce } from 'lodash-es';

	interface Props {
		searchTerm?: string;
		onSelect: (emoji: string) => void;
	}

	let emojis: Emojis = $state(emojisRaw);
	let categories = Object.keys(emojis);
	let selectedCatergory = $state(categories[0]);
	let skinTone = $state('default');
	let debouncedSearchTerm = $state('');

	const skinTones: Record<string, string> = {
		default: '✋',
		'light skin tone': '✋🏻',
		'medium-light skin tone': '✋🏼',
		'medium skin tone': '✋🏽',
		'medium-dark skin tone': '✋🏾',
		'dark skin tone': '✋🏿'
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
		Symbols: '⚠',
		Flags: '🏳️'
	};

	let { searchTerm = $bindable(''), onSelect }: Props = $props();

	// Create a memoized cache for filtered results
	const filteredEmojiCache = new Map();

	// Debounce the search term updates
	const updateDebouncedSearch = debounce((value: string) => {
		debouncedSearchTerm = value;
	}, 300);

	$effect(() => {
		updateDebouncedSearch(searchTerm);
	});

	function getCacheKey(category: string, searchTerm: string, skinTone: string): string {
		return `${category}:${searchTerm}:${skinTone}`;
	}

	function applyFilters(
		catgEmojis: EmojiItem[],
		searchTerm: string,
		skinTone: string
	): EmojiItem[] {
		const cacheKey = getCacheKey(selectedCatergory, searchTerm, skinTone);
		// Check cache first
		if (filteredEmojiCache.has(cacheKey)) {
			return filteredEmojiCache.get(cacheKey);
		}
		searchTerm = searchTerm.trim().toLowerCase();
		let updatedEmojis: EmojiItem[];
		// Only flatten all categories if there's a search term
		if (searchTerm !== '') {
			updatedEmojis = Array.from(Object.values(emojis).flat());
		} else {
			updatedEmojis = catgEmojis;
		}
		// Apply skin tone filter
		if (skinTone !== 'default') {
			updatedEmojis = updatedEmojis.filter((emoji) => emoji.name.includes(skinTone));
		} else {
			updatedEmojis = updatedEmojis.filter((emoji) => !emoji.name.includes('skin tone'));
		}
		// Apply search filter
		if (searchTerm !== '') {
			updatedEmojis = updatedEmojis.filter((emoji) =>
				emoji.name.toLowerCase().includes(searchTerm)
			);
		}
		// Cache the results
		filteredEmojiCache.set(cacheKey, updatedEmojis);
		limitCacheSize();
		return updatedEmojis;
	}

	// Clear cache when category or skin tone changes
	// Clear cache when category or skin tone changes
	$effect(() => {
		const _ = selectedCatergory; // reference to trigger effect
		const __ = skinTone; // reference to trigger effect
		filteredEmojiCache.clear();
	});

	// Limit cache size
	function limitCacheSize(maxSize = 100) {
		if (filteredEmojiCache.size > maxSize) {
			const keysToDelete = Array.from(filteredEmojiCache.keys()).slice(
				0,
				filteredEmojiCache.size - maxSize
			);
			keysToDelete.forEach((key) => filteredEmojiCache.delete(key));
		}
	}
</script>

<Tabs.Root bind:value={selectedCatergory} class="w-96 flex flex-col-reverse">
	<Tabs.List class="w-96 flex items-center justify-evenly rounded-sm">
		{#each categories as catergory}
			<Tabs.Trigger value={catergory} class="text-[1.25rem] p-1">
				<Tooltip text={catergory}>
					{categoriesEmojis[catergory]}
				</Tooltip>
			</Tabs.Trigger>
		{/each}
	</Tabs.List>
	<Tabs.Content value={selectedCatergory} class="h-96 w-96 overflow-auto">
		<div class="flex flex-wrap gap-1">
			{#each applyFilters(emojis[selectedCatergory], debouncedSearchTerm, selectedCatergory === 'People & Body' || searchTerm.trim() !== '' ? skinTone : 'default') as emoji}
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
	<div class="flex items-center gap-2 p-1">
		<div class="flex items-center relative w-full">
			<Input bind:value={searchTerm} placeholder="Search Emojies..." />
			<span class="flex absolute right-0">
				<Button variant="ghost" class="size-9" onclick={() => (searchTerm = '')}>
					<X />
				</Button>
			</span>
		</div>
		<Button variant="outline" class="size-9 text-xl p-2">
			<Tooltip text="Select Random">
				<Shuffle />
			</Tooltip>
		</Button>
		<Popover.Root>
			<Popover.Trigger class={buttonVariants({ variant: 'outline', class: 'size-9 text-xl p-2' })}>
				<Tooltip text="Skin Tones">
					{skinTones[skinTone]}
				</Tooltip>
			</Popover.Trigger>
			<Popover.Content class="flex h-fit w-fit p-2">
				{#each Object.keys(skinTones) as st}
					<Button variant="ghost" class="size-8 text-xl p-1" onclick={() => (skinTone = st)}>
						<Tooltip text={st}>
							{[skinTones[st]]}
						</Tooltip>
					</Button>
				{/each}
			</Popover.Content>
		</Popover.Root>
	</div>
</Tabs.Root>
