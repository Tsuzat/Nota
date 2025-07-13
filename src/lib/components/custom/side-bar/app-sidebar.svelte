<script lang="ts" module>
	import HouseIcon from '@lucide/svelte/icons/house';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Settings2Icon from '@lucide/svelte/icons/settings-2';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	const data = {
		navMain: [
			{
				title: 'Search',
				url: '#',
				icon: SearchIcon
			},
			{
				title: 'Ask AI',
				url: '#',
				icon: SparklesIcon
			},
			{
				title: 'Home',
				url: '#',
				icon: HouseIcon,
				isActive: true
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '#',
				icon: Settings2Icon
			},
			// {
			// 	title: 'Templates',
			// 	url: '#',
			// 	icon: BlocksIcon
			// },
			{
				title: 'Trash',
				url: '#',
				icon: Trash2Icon
			}
		]
	};
</script>

<script lang="ts">
	import NavFavorites from './nav-favorites.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import NavWorkspacesLocal from './nav-workspaces-local.svelte';
	import { ISTAURI } from '$lib/utils';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher />
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavFavorites />
		{#if ISTAURI}
			<NavWorkspacesLocal />
		{/if}
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
