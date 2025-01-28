<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Themetoggler from '../themetoggler.svelte';
	import { SHOW_DECORATION } from '$lib/contants';
	import IconRender from '$lib/components/icons/icon-render.svelte';
	import { USER_ICON, USER_NAME } from '$lib/app_settings';
	import { Button } from '$lib/components/ui/button';
	import { APP_MENU } from '$lib/app_menu';

	async function onClickIcon() {
		await APP_MENU.popup();
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem
		{...$SHOW_DECORATION ? {} : { 'data-tauri-drag-region': '' }}
		class="flex items-center justify-between "
	>
		<div class="flex items-center gap-2 w-full mr-8">
			{#if $SHOW_DECORATION}
				<IconRender icon={$USER_ICON} />
			{:else}
				<Button variant="ghost" size="icon" class="size-fit p-1" onclick={onClickIcon}>
					<IconRender icon={$USER_ICON} />
				</Button>
			{/if}
			<span class="text-ellipsis font-bold">{$USER_NAME}</span>
		</div>
		<Themetoggler />
	</Sidebar.MenuItem>
</Sidebar.Menu>
