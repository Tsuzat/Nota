<script lang="ts" module>
	interface IconData {
		[key: string]: {
			body: string; // SVG path string
		};
	}
</script>

<script lang="ts">
	import iconRaw from '$lib/assets/jsons/icons.json';
	import { X } from 'lucide-svelte';
	import Tooltip from '../customs/tooltip.svelte';
	import Button from '../ui/button/button.svelte';
	import { Input } from '../ui/input';
	import SvgIcon from './svg-icon.svelte';
	import { debounce } from 'lodash-es';

	let allIcons: IconData = iconRaw as IconData;
	let availableIcons: string[] = $state(Object.keys(allIcons));
	// loaded icons has 200 icons
	let loadedIconsName: string[] = $state(availableIcons.slice(0, 200));
	// search term
	let searchTerm = $state('');

	let searchCache = new Map();

	// Debounce the search term updates
	const updateDebouncedSearch = debounce((value: string) => {
		// if the search term is empty, reset the loaded icons
		value = value.trim();
		if (value === '') {
			availableIcons = Object.keys(allIcons);
		} else {
			if (searchCache.has(value)) {
				// if the search term is not empty, search for the icons
				// check the search cache first
				availableIcons = searchCache.get(value);
				return;
			} else {
				availableIcons = Object.keys(allIcons).filter((icon) => {
					return icon.toLowerCase().includes(value.toLowerCase());
				});
				searchCache.set(value, availableIcons);
			}
		}
		loadedIconsName = availableIcons.slice(0, 200);
	}, 300);

	$effect(() => {
		updateDebouncedSearch(searchTerm);
	});

	function loadMoreIcons() {
		let lengthOfLoadedIcons = loadedIconsName.length;
		if (lengthOfLoadedIcons < availableIcons.length) {
			let newIcons = availableIcons.slice(lengthOfLoadedIcons, lengthOfLoadedIcons + 200);
			loadedIconsName = [...loadedIconsName, ...newIcons];
		}
	}
</script>

<div>
	<div class="mx-2">
		<div class="relative flex items-center">
			<Input placeholder="Search Icons..." bind:value={searchTerm} class="pr-6 mx-1" />
			<Button variant="ghost" class="size-4 p-0 absolute right-2" onclick={() => (searchTerm = '')}>
				<X />
			</Button>
		</div>
	</div>
	<div class="h-96 w-96 overflow-auto" onscrollend={loadMoreIcons}>
		<div class="flex flex-wrap gap-1 p-2">
			{#each loadedIconsName as icon}
				{@const iconData = allIcons[icon]}
				<Button variant="ghost" class="m-0 p-0 size-8 [&_svg]:size-6" onclick={() => {}}>
					<Tooltip text={icon} delayDuration={100}>
						<SvgIcon body={iconData.body} />
					</Tooltip>
				</Button>
			{/each}
		</div>
	</div>
</div>
