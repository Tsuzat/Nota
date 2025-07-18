<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getKeyboardShortcut } from '$lib/utils';
	import { Home, Search, Sparkle } from '@lucide/svelte';
	import { getGlobalSearch } from '../global-search/constants.svelte';

	const search = getGlobalSearch();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton onclick={() => (search.open = true)}>
			<Search />
			<span>Search</span>
			<Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded p-1">
				{getKeyboardShortcut('K', true)}
			</Sidebar.MenuBadge>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton>
			<Sparkle />
			<span>Ask AI</span>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton isActive={page.url.pathname.endsWith('/home')}>
			<Home />
			<span>Home</span>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
