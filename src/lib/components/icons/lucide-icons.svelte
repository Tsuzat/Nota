<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as icons from 'lucide-svelte';
	import { X, Shuffle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import Tooltip from '../customs/tooltip.svelte';
	import { onDestroy } from 'svelte';

	$effect(() => {
		loadedIcons = iconsName.slice(0, 200);
	});

	interface Props {
		name: string;
		onSelect: (icon: string) => void;
	}

	// Load all lucide icons
	let allLucideIcons = Object.keys(icons).filter(
		(icon) => icon.includes('Icon') && icon !== 'Icon'
	);
	// Loads the currently loaded icons
	let iconsName = $state(allLucideIcons);
	let loadedIcons: string[] = $state([]);
	let bufferSize = 100;
	let search = $state('');

	// Search related effects
	$effect(() => {
		if (search.trim() === '') iconsName = allLucideIcons;
		else
			iconsName = allLucideIcons.filter((icon) =>
				icon.toLocaleLowerCase().includes(search.toLowerCase())
			);
	});

	let { name = $bindable('FolderIcon'), onSelect }: Props = $props();

	function onselect(icon: string) {
		name = icon;
		onSelect(icon);
	}

	function loadMoreIcons() {
		loadedIcons = iconsName.slice(0, loadedIcons.length + bufferSize);
	}

	function shuffle() {
		name = iconsName[Math.floor(Math.random() * iconsName.length)];
	}

	onDestroy(() => {
		loadedIcons = iconsName.slice(0, 200);
	});
</script>

<div class="w-96 h-full">
	<div class="flex items-center justify-around gap-2 p-2">
		<Tooltip text={name ?? ''}>
			{@const Icon = icons[name ?? '']}
			<Icon class="size-9 p-2 border rounded-md" />
			<!-- <LucideIconRender icon={name ?? ''} class="size-9 p-2 border rounded-md" /> -->
		</Tooltip>
		<span class="flex relative items-center w-80">
			<Input type="text" placeholder="Search icons..." class="pr-12" bind:value={search} />
			<Button
				variant="ghost"
				class="size-4 p-1 absolute right-1"
				title="Clear Search"
				onclick={() => (search = '')}
			>
				<Tooltip text="Clear Search">
					<X />
				</Tooltip>
			</Button>
		</span>
		<Tooltip text="Choose Random Icon">
			<Button variant="outline" class="size-9 text-xl p-2" title="Shuffle Icons" onclick={shuffle}>
				<Shuffle />
			</Button>
		</Tooltip>
	</div>
	{#if iconsName.length === 0}
		<div class="h-20 text-center w-full inline-flex justify-center items-center">
			<p class="text-lg text-muted-foreground text-center">No icons found</p>
		</div>
	{/if}
	<div class="flex flex-wrap gap-1 max-h-96 overflow-auto" onscrollend={loadMoreIcons}>
		{#each loadedIcons as icon}
			<!-- {@const Icon = icons[icon]} -->
			<Tooltip text={icon}>
				<Button variant="ghost" class="size-8 text-xl p-1" onclick={() => onselect(icon)}>
					{@const Icon = icons[icon]}
					<Icon />
					<!-- <LucideIconRender {icon} /> -->
				</Button>
			</Tooltip>
		{/each}
	</div>
	<div class="text-xs text-muted-foreground text-center w-full mt-2 p-1 border-t">
		<span>Loaded {loadedIcons.length}/{iconsName.length} icons. Scroll to load more.</span>
	</div>
</div>
