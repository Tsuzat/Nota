<script lang="ts">
import ToggleMode from '@nota/ui/custom/ToggleMode.svelte';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { type ComponentProps, onMount } from 'svelte';
import { APPWINDOW } from '$lib/contants';
import { ISMACOS } from '$lib/utils';
import AppLogoMenu from '../app-menu.svelte';
import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
import NavFavorites from './nav-favorites.svelte';
import NavMain from './nav-main.svelte';
import NavSecondary from './nav-secondary.svelte';
import NavWorkspacesCloud from './nav-workspaces-cloud.svelte';
import NavWorkspacesLocal from './nav-workspaces-local.svelte';
import TeamSwitcher from './userworkspace-switcher.svelte';

let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
const currentUserWorkspace = $derived(useCurrentUserWorkspaceContext());

let IS_MAXIMUM = $state(false);

onMount(async () => {
  IS_MAXIMUM = await APPWINDOW.isFullscreen();
  APPWINDOW.listen('tauri://resize', async () => {
    IS_MAXIMUM = await APPWINDOW.isFullscreen();
  });
});
</script>

<Sidebar.Root bind:ref class="border-r-0" {...restProps}>
	<Sidebar.Header>
			<div data-tauri-drag-region class="flex h-10 items-center justify-between">
				{#if ISMACOS  && !IS_MAXIMUM}
					<div></div>
				{:else}
					<AppLogoMenu />
				{/if}
				<ToggleMode />
			</div>
		<TeamSwitcher />
		<NavMain />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavFavorites />
		{#if currentUserWorkspace.getIsLocal()}
			<NavWorkspacesLocal />
		{/if}
		{#if !currentUserWorkspace.getIsLocal()}
			<NavWorkspacesCloud />
		{/if}
	</Sidebar.Content>
	<Sidebar.Footer class="p-0">
		<NavSecondary />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
