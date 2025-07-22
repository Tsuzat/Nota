<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getKeyboardShortcut } from '$lib/utils';
	import { Home, Search } from '@lucide/svelte';
	import { getGlobalSearch } from '../global-search/constants.svelte';
	import { goto } from '$app/navigation';

	const search = getGlobalSearch();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton class="border py-2" onclick={() => (search.open = true)}>
			<Search />
			<span>Search</span>
			<Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded-md p-1">
				{getKeyboardShortcut('K', true)}
			</Sidebar.MenuBadge>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
	<!-- <Sidebar.MenuItem>
		<Sidebar.MenuButton>
			<Sparkle />
			<span>Ask AI</span>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem> -->
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
			isActive={page.url.pathname.endsWith('/home')}
			onclick={() => goto('/home')}
		>
			<Home />
			<span>Home</span>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
