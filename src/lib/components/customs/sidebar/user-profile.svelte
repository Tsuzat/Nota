<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Themetoggler from '../themetoggler.svelte';
	import { SHOW_DECORATION, USER_NAME } from '$lib/app_settings';
	import { Button } from '$lib/components/ui/button';
	import { APP_MENU } from '$lib/app_menu';
	import src from '$lib/assets/static/icon.png';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem
		{...$SHOW_DECORATION ? {} : { 'data-tauri-drag-region': '' }}
		class="flex items-center justify-between h-10 min-h-10 max-h-10 m-0 p-0 mb-2"
	>
		<div class="flex items-center gap-2 w-full mr-8">
			{#if $SHOW_DECORATION}
				<img {src} alt="user-icon" class="size-5" />
			{:else}
				<Button variant="ghost" size="icon" class="size-6 p-1" onclick={() => APP_MENU.popup()}>
					<img {src} alt="user-icon" class="size-full" />
				</Button>
			{/if}
			<span class="text-ellipsis font-bold">{$USER_NAME}</span>
		</div>
		<Themetoggler />
	</Sidebar.MenuItem>
</Sidebar.Menu>
