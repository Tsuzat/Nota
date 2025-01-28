<script lang="ts" module>
	import House from 'lucide-svelte/icons/house';
	import Search from 'lucide-svelte/icons/search';
	const data = {
		navMain: [
			{
				title: 'Home',
				url: '/',
				icon: House,
				isActive: false
			},
			{
				title: 'Search',
				url: '#',
				icon: Search,
				onClick: () => {
					OPEN_COMMAND_BAR.set(true);
				}
			}
		]
	};
</script>

<script lang="ts">
	import NavFavorites from '$lib/components/customs/sidebar/nav-favorites.svelte';
	import NavMain from '$lib/components/customs/sidebar/nav-main.svelte';
	import NavSecondary from '$lib/components/customs/sidebar/nav-secondary.svelte';
	import NavWorkspaces from '$lib/components/customs/sidebar/nav-workspaces.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { OPEN_COMMAND_BAR } from '$lib/contants';
	import UserProfile from './user-profile.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
		<UserProfile />
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavFavorites />
		<NavWorkspaces />
		<NavSecondary class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
