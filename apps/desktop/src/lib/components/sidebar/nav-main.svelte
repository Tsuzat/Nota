<script lang="ts">
import Home from '@nota/ui/icons/moving-icons/home.svelte';
import Search from '@nota/ui/icons/moving-icons/search.svelte';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { getKeyboardShortcut } from '$lib/utils';
import { getGlobalSearch } from '../global-search/constants.svelte';

const search = getGlobalSearch();

let isHomeHovered = $state(false);
let isSearchHovered = $state(false);
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
			class="border p-2"
			onclick={() => (search.open = true)}
			onmouseenter={() => (isSearchHovered = true)}
			onmouseleave={() => (isSearchHovered = false)}
		>
			<Search size={18} isHovered={isSearchHovered} />
			<span>Search</span>
			<Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded-md p-1">
				{getKeyboardShortcut('K', true)}
			</Sidebar.MenuBadge>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
		class="mt-1"
			isActive={page.url.pathname.endsWith('/')}
			onclick={() => goto(resolve('/'))}
			onmouseenter={() => (isHomeHovered = true)}
			onmouseleave={() => (isHomeHovered = false)}
		>
			<Home size={18} isHovered={isHomeHovered} />
			<span>Home</span>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
