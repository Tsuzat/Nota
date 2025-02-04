<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/dm-sans';
	import '../app.css';
	import SidebarPage from '$lib/components/customs/sidebar/sidebar-page.svelte';
	import { onMount } from 'svelte';
	import NewWorkSpace from '$lib/components/customs/dialogs/NewWorkSpace.svelte';
	import Sonner from '$lib/components/ui/sonner/sonner.svelte';
	import Commandbar from '$lib/components/customs/dialogs/commandbar.svelte';
	import { checkUpdate } from '$lib/updater';
	import { APPWINDOW, NOTES } from '$lib/contants';
	import { RECENT_NOTES } from '$lib/recents';
	import WindowButtons from '$lib/components/customs/window-buttons.svelte';
	import { CHECK_UPDATE_ON_START, SHOW_DECORATION } from '$lib/app_settings';
	let { children } = $props();

	onMount(async () => {
		await APPWINDOW.show();

		// check for updates
		if ($CHECK_UPDATE_ON_START) await checkUpdate(true);
	});
</script>

<ModeWatcher />
<Sonner richColors />

<Commandbar />
<NewWorkSpace />

<SidebarPage>
	{#if $SHOW_DECORATION === false}
		<WindowButtons />
	{/if}
	{@render children()}
</SidebarPage>
