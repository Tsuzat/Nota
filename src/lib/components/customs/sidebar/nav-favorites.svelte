<script lang="ts">
	import { page } from '$app/state';
	import IconRender from '$lib/components/icons/icon-render.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { NOTES } from '$lib/contants';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Link from 'lucide-svelte/icons/link';
	import StarOff from 'lucide-svelte/icons/star-off';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	const sidebar = useSidebar();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Favorites</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each $NOTES.filter((notes) => notes.favorite) as favorite (favorite.id)}
			<Sidebar.MenuItem
				data-active={page.url.pathname === `/${favorite.id}`}
				class="data-[active=true]:bg-muted/70 rounded"
			>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href="/{favorite.id}" title={favorite.name} {...props}>
							<IconRender icon={favorite.icon} />
							<span>{favorite.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuAction showOnHover {...props}>
								<Ellipsis />
								<span class="sr-only">More</span>
							</Sidebar.MenuAction>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-56 rounded-lg"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align={sidebar.isMobile ? 'end' : 'start'}
					>
						<DropdownMenu.Item>
							<StarOff class="text-muted-foreground" />
							<span>Remove from Favorites</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<Link class="text-muted-foreground" />
							<span>Copy Link</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<ArrowUpRight class="text-muted-foreground" />
							<span>Open in New Tab</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							class="text-destructive hover:bg-destructive/10 hover:text-muted-foreground"
						>
							<Trash2 />
							<span>Delete</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		{/each}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton class="text-sidebar-foreground/70">
				<Ellipsis />
				<span class="text-xs">More</span>
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Group>
