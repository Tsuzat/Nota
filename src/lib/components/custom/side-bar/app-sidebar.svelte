<script lang="ts">
	import NavFavorites from './nav-favorites.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import type { ComponentProps } from 'svelte';
	import NavWorkspacesLocal from './nav-workspaces-local.svelte';
	import { ISMACOS, ISTAURI } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import ToggleMode from '../toggle-mode.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
		<div data-tauri-drag-region class="flex h-8 items-center justify-between">
			{#if ISMACOS}
				<div></div>
			{:else}
				<Button variant="ghost" size="icon" class="z-10">
					<img src="/favicon.png" alt="AppLogo" class="aspect-square size-6" />
				</Button>
			{/if}
			<ToggleMode />
		</div>
		<TeamSwitcher />
		<NavMain />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavFavorites />
		{#if ISTAURI}
			<NavWorkspacesLocal />
		{/if}
		<NavSecondary />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
