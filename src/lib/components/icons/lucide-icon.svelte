<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as icons from 'lucide-svelte';
	import { X, Shuffle, Search } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import Tooltip from '../customs/tooltip.svelte';
	import { onDestroy } from 'svelte';

	let iconsName = Object.keys(icons).filter((icon) => icon.includes('Icon') && icon !== 'Icon');
	let loadedIcons = $state(iconsName.slice(0, 200));
	let bufferSize = 100;
	let search = $state('');

	let { name }: { name?: string } = $props();

	if (name === undefined) name = iconsName[0];

	function loadMoreIcons() {
		if (search.trim() !== '') return;
		loadedIcons = iconsName.slice(0, loadedIcons.length + bufferSize);
	}

	function searchIcon() {
		if (search.trim() === '') {
			loadedIcons = iconsName.slice(0, 200);
			return;
		}
		loadedIcons = iconsName.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));
	}

	onDestroy(() => {
		loadedIcons = iconsName.slice(0, 200);
	});
</script>

<div class="w-96 h-full">
	<div class="flex items-center justify-around gap-2 p-2">
		<Tooltip text={name ?? ''}>
			{@const Icon = icons[name]}
			<Icon class="size-9 p-2 border rounded-md" />
		</Tooltip>
		<span class="flex relative items-center w-80">
			<Input type="text" placeholder="Search icon" class="pr-12" bind:value={search} />
			<Button variant="ghost" class="size-4 p-1 absolute right-1" onclick={() => (search = '')}>
				<Tooltip text="Clear Search">
					<X />
				</Tooltip>
			</Button>
			<Button variant="ghost" class="size-4 p-1 absolute right-8" onclick={searchIcon}>
				<Tooltip text="Search Icon">
					<Search />
				</Tooltip>
			</Button>
		</span>
		<Tooltip text="Random Icon">
			<Button variant="outline" class="size-9 text-xl p-2">
				<Shuffle />
			</Button>
		</Tooltip>
	</div>
	{#if loadedIcons.length === 0}
		<div class="h-20 text-center w-full inline-flex justify-center items-center">
			<p class="text-lg text-muted-foreground text-center">No icons found</p>
		</div>
	{/if}
	<div class="flex flex-wrap gap-1 max-h-96 min-h-40 overflow-auto" onscrollend={loadMoreIcons}>
		{#each loadedIcons as icon}
			{@const Icon = icons[icon]}
			<Tooltip text={icon}>
				<Button variant="ghost" class="size-8 text-xl p-1" onclick={() => (name = icon)}>
					<Icon />
				</Button>
			</Tooltip>
		{/each}
	</div>
</div>
