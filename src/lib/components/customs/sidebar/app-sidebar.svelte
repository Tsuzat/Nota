<script lang="ts" module>
	import AudioWaveform from 'lucide-svelte/icons/audio-waveform';
	import Blocks from 'lucide-svelte/icons/blocks';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Command from 'lucide-svelte/icons/command';
	import House from 'lucide-svelte/icons/house';
	import Inbox from 'lucide-svelte/icons/inbox';
	import MessageCircleQuestion from 'lucide-svelte/icons/message-circle-question';
	import Search from 'lucide-svelte/icons/search';
	import Settings2 from 'lucide-svelte/icons/settings-2';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	// This is sample data.
	const data = {
		teams: [
			{
				name: 'Acme Inc',
				logo: Command,
				plan: 'Enterprise'
			},
			{
				name: 'Acme Corp.',
				logo: AudioWaveform,
				plan: 'Startup'
			},
			{
				name: 'Evil Corp.',
				logo: Command,
				plan: 'Free'
			}
		],
		navMain: [
			{
				title: 'Search',
				url: '#',
				icon: Search,
				onClick: () => {
					OPEN_COMMAND_BAR.set(true);
				}
			},
			{
				title: 'Home',
				url: '/',
				icon: House,
				isActive: false
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '#',
				icon: Settings2
			},
			{
				title: 'Trash',
				url: '#',
				icon: Trash2
			},
			{
				title: 'Help',
				url: '#',
				icon: MessageCircleQuestion
			}
		]
	};
</script>

<script lang="ts">
	import NavFavorites from '$lib/components/customs/sidebar/nav-favorites.svelte';
	import NavMain from '$lib/components/customs/sidebar/nav-main.svelte';
	import NavSecondary from '$lib/components/customs/sidebar/nav-secondary.svelte';
	import NavWorkspaces from '$lib/components/customs/sidebar/nav-workspaces.svelte';
	import TeamSwitcher from '$lib/components/customs/sidebar/team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { page } from '$app/stores';
	import { OPEN_COMMAND_BAR } from '$lib/contants';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
		<NavMain items={data.navMain} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavFavorites />
		<NavWorkspaces />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
