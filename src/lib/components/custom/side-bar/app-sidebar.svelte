<script lang="ts">
	import NavFavorites from './nav-favorites.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import type { ComponentProps } from 'svelte';
	import NavWorkspacesLocal from './nav-workspaces-local.svelte';
	import { ISMACOS, ISTAURI } from '$lib/utils';
	import ToggleMode from '../toggle-mode.svelte';
	import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
	import NavWorkspacesCloud from './nav-workspaces-cloud.svelte';
	import AppLogoMenu from '../app-logo-menu.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
	const currentUserWorkspace = $derived(useCurrentUserWorkspaceContext());
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
		{#if ISTAURI}
			<div data-tauri-drag-region class="flex h-8 items-center justify-between">
				{#if ISMACOS}
					<div></div>
				{:else}
					<AppLogoMenu />
				{/if}
				<ToggleMode />
			</div>
		{/if}
		<TeamSwitcher />
		<NavMain />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavFavorites />
		{#if ISTAURI && currentUserWorkspace.getIsLocal()}
			<NavWorkspacesLocal />
		{/if}
		{#if !currentUserWorkspace.getIsLocal()}
			<NavWorkspacesCloud />
		{/if}
		<NavSecondary />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
