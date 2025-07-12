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
	import Tooltip from '$lib/components/custom/simple-tooltip.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Popover from '$lib/components/ui/popover';
	import { Button, buttonVariants } from '../ui/button';
	import Input from '../ui/input/input.svelte';
	import { Shuffle, X } from '@lucide/svelte';

	interface Props {
		searchTerm?: string;
		onSelect?: (emoji: string) => void;
	}

	let emojis: Emojis = $state(emojisRaw);
	let categories = Object.keys(emojis);
	let selectedCategory = $state(categories[0]);
	let skinTone = $state('default');
	let debouncedSearchTerm = $state('');
	let debounceTimeout: number | null = null;

	const skinTones: Record<string, string> = {
		default: '✋',
		'light skin tone': '✋🏻',
		'medium-light skin tone': '✋🏼',
		'medium skin tone': '✋🏽',
		'medium-dark skin tone': '✋🏾',
		'dark skin tone': '✋🏿'
	};

	const categoriesEmojis: Record<string, string> = {
		'Smileys & Emotion': '😊',
		Component: '🧩',
		'People & Body': '👨‍👩‍👧‍👦',
		'Animals & Nature': '🐶',
		'Food & Drink': '🍔',
		'Travel & Places': '🌍',
		Activities: '⚽',
		Objects: '💡',
		Symbols: '❤️',
		Flags: '🏳️'
	};

	let { searchTerm = $bindable(''), onSelect }: Props = $props();

	// Optimized cache with size limit
	const filteredEmojiCache = new Map<string, EmojiItem[]>();
	const MAX_CACHE_SIZE = 50;

	// Native debounce implementation
	function debounce(func: (value: string) => void, delay: number) {
		return (value: string) => {
			if (debounceTimeout) clearTimeout(debounceTimeout);
			debounceTimeout = setTimeout(() => func(value), delay);
		};
	}

	const updateDebouncedSearch = debounce((value: string) => {
		debouncedSearchTerm = value;
	}, 200);

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
		const cacheKey = getCacheKey(selectedCategory, searchTerm, skinTone);

		// Check cache first
		if (filteredEmojiCache.has(cacheKey)) {
			return filteredEmojiCache.get(cacheKey)!;
		}

		const normalizedSearchTerm = searchTerm.trim().toLowerCase();
		let updatedEmojis: EmojiItem[];

		// Only flatten all categories if there's a search term
		if (normalizedSearchTerm !== '') {
			updatedEmojis = Object.values(emojis).flat();
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
		if (normalizedSearchTerm !== '') {
			updatedEmojis = updatedEmojis.filter((emoji) =>
				emoji.name.toLowerCase().includes(normalizedSearchTerm)
			);
		}

		// Cache the results with size management
		if (filteredEmojiCache.size >= MAX_CACHE_SIZE) {
			const firstKey = filteredEmojiCache.keys().next().value;
			if (firstKey) filteredEmojiCache.delete(firstKey);
		}
		filteredEmojiCache.set(cacheKey, updatedEmojis);

		return updatedEmojis;
	}

	// Clear cache when category or skin tone changes
	$effect(() => {
		const _ = selectedCategory;
		const __ = skinTone;
		filteredEmojiCache.clear();
	});

	function getRandom(): string {
		const allEmojis = Object.values(emojis).flat();
		const randomIndex = Math.floor(Math.random() * allEmojis.length);
		return allEmojis[randomIndex].emoji;
	}

	// Computed filtered emojis for better performance
	const filteredEmojis = $derived(() => {
		const categoryEmojis = emojis[selectedCategory] || [];
		const shouldUseSkinTone =
			selectedCategory === 'People & Body' || debouncedSearchTerm.trim() !== '';
		return applyFilters(
			categoryEmojis,
			debouncedSearchTerm,
			shouldUseSkinTone ? skinTone : 'default'
		);
	});

	// Clear search function
	function clearSearch() {
		searchTerm = '';
		debouncedSearchTerm = '';
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			clearSearch();
		}
	}
</script>

<Tabs.Root bind:value={selectedCategory} class="flex h-96 w-full flex-col-reverse gap-0">
	<Tabs.List class="flex w-full items-center justify-evenly rounded-sm">
		{#each categories as catergory}
			<Tabs.Trigger value={catergory}>
				<Tooltip content={catergory}>
					{categoriesEmojis[catergory]}
				</Tooltip>
			</Tabs.Trigger>
		{/each}
	</Tabs.List>
	<Tabs.Content value={selectedCategory} class="w-full overflow-y-auto">
		<div class="grid grid-cols-10 justify-between">
			{#each applyFilters(emojis[selectedCategory], debouncedSearchTerm, selectedCategory === 'People & Body' || searchTerm.trim() !== '' ? skinTone : 'default') as emoji}
				<Tooltip content={emoji.name}>
					<Button
						variant="ghost"
						size="icon"
						class="p-1 text-xl"
						onclick={() => {
							onSelect?.('emoji:' + emoji.emoji);
						}}
					>
						{emoji.emoji}
					</Button>
				</Tooltip>
			{/each}
		</div>
	</Tabs.Content>
	<div class="flex w-full items-center justify-between gap-2 p-1">
		<div class="relative flex w-full items-center">
			<Input bind:value={searchTerm} placeholder="Search Emojies..." class="pr-6" />
			<Button variant="ghost" class="absolute right-2 size-4 p-0" onclick={() => (searchTerm = '')}>
				<Tooltip content="Clear Search">
					<X />
				</Tooltip>
			</Button>
		</div>
		<Tooltip content="Select Random">
			<Button
				variant="outline"
				class="size-9 p-2 text-xl"
				onclick={() => onSelect?.('emoji:' + getRandom())}
			>
				<Shuffle />
			</Button>
		</Tooltip>
		<Popover.Root>
			<Popover.Trigger class={buttonVariants({ variant: 'outline', class: 'size-9 p-2 text-xl' })}>
				<Tooltip content="Skin Tones">
					{skinTones[skinTone]}
				</Tooltip>
			</Popover.Trigger>
			<Popover.Content class="bg-popover flex h-fit w-fit p-0">
				{#each Object.keys(skinTones) as st}
					<Button variant="ghost" class="size-8 p-1 text-xl" onclick={() => (skinTone = st)}>
						<Tooltip content={st}>
							{[skinTones[st]]}
						</Tooltip>
					</Button>
				{/each}
			</Popover.Content>
		</Popover.Root>
	</div>
</Tabs.Root>
