<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/dm-sans';
	import '../app.css';
	import SidebarPage from '$lib/components/customs/sidebar/sidebar-page.svelte';
	import { onMount } from 'svelte';
	import NewWorkSpace from '$lib/components/customs/dialogs/NewWorkSpace.svelte';
	import Sonner from '$lib/components/ui/sonner/sonner.svelte';
	import Commandbar from '$lib/components/customs/dialogs/commandbar.svelte';
	import { ask } from '@tauri-apps/plugin-dialog';
	import { check } from '@tauri-apps/plugin-updater';
	import { downloadAndInstall } from '$lib/updater';
	import { APPWINDOW } from '$lib/contants';
	let { children } = $props();

	onMount(async () => {
		await APPWINDOW.show();
		// check for updates
		const update = await check();
		if (update) {
			const shouldUpdate = await ask(
				`New version ${update.version} is available for application. Do you want to update the application?`,
				{
					kind: 'info',
					title: 'Update Available',
					okLabel: 'Update'
				}
			);
			if (shouldUpdate) {
				downloadAndInstall(update);
			}
		}
	});
</script>

<ModeWatcher />
<Sonner richColors />

<Commandbar />
<NewWorkSpace />

<SidebarPage>
	{@render children()}
</SidebarPage>
