<script lang="ts">
	import { icons } from '@lucide/svelte';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	import { Button } from '../ui/button';
	import IconRenderer from './lucide-renderer.svelte';
	import { Input } from '$lib/components/ui/input';
	import Tooltip from '../custom/simple-tooltip.svelte';

	const allLucideIcons = Object.keys(icons) as Array<keyof typeof icons>;

	let iconNames = $state(allLucideIcons);

	interface Props {
		onSelect?: (icon: string) => void;
	}
	let { onSelect }: Props = $props();

	let loadedIcons = $state(100);
	let searchTerm = $state('');

	function updateSearch(searchTerm: string) {
		if (searchTerm.trim() === '') {
			iconNames = allLucideIcons;
			loadedIcons = 100;
		} else {
			iconNames = allLucideIcons.filter((iconName) =>
				iconName.toLowerCase().includes(searchTerm.toLowerCase())
			);
			loadedIcons = Math.min(iconNames.length, 100);
		}
	}

	function onscroll() {
		loadedIcons = Math.min(iconNames.length, loadedIcons + 100);
	}

	let iconListDiv: HTMLDivElement | null = null;

	function handleScroll() {
		if (!iconListDiv) return;
		const { scrollTop, scrollHeight, clientHeight } = iconListDiv;
		// Load more when scrolled within 50px of the bottom
		if (scrollTop + clientHeight >= scrollHeight - 50) {
			onscroll();
		}
	}

	let searchDebounce: ReturnType<typeof setTimeout> | null = null;

	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchTerm = value;
		if (searchDebounce) clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => {
			updateSearch(searchTerm);
		}, 300);
	}
</script>

<div class="flex h-96 w-full flex-col gap-1">
	<div class="flex h-12 items-center gap-2 p-1">
		<div class="relative">
			<Input
				type="text"
				bind:value={searchTerm}
				oninput={handleInput}
				class="peer ps-10"
				placeholder="Search Icons"
			/>
			<span
				class="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm peer-disabled:opacity-50"
			>
				<Search class="size-4" />
			</span>
		</div>
		<Button
			variant="outline"
			size="icon"
			title="Clear Search"
			class="absolute right-2"
			onclick={() => {
				searchTerm = '';
				updateSearch(searchTerm);
			}}
		>
			<X />
		</Button>
	</div>
	<div
		class="grid w-full grid-cols-10 flex-wrap justify-between overflow-y-auto"
		bind:this={iconListDiv}
		onscroll={handleScroll}
	>
		{#each iconNames.slice(0, loadedIcons) as iconName, idx (idx)}
			<Tooltip content={iconName}>
				<Button
					variant="ghost"
					size="icon"
					onclick={() => {
						onSelect?.(`lucide:${iconName}`);
					}}
				>
					<IconRenderer icon={iconName} />
				</Button>
			</Tooltip>
		{/each}
	</div>
</div>
