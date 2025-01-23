<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/dm-sans';
	import '../app.css';
	import SidebarPage from '$lib/components/customs/sidebar/sidebar-page.svelte';
	import { onMount } from 'svelte';
	import NewWorkSpace from '$lib/components/customs/dialogs/NewWorkSpace.svelte';
	import Sonner from '$lib/components/ui/sonner/sonner.svelte';
	import Commandbar from '$lib/components/customs/dialogs/commandbar.svelte';
	import { check } from '@tauri-apps/plugin-updater';
	import { downloadAndInstall } from '$lib/updater';
	import { APPWINDOW, NOTES, OS } from '$lib/contants';
	import { toast } from 'svelte-sonner';
	import { RECENT_NOTES } from '$lib/recents';
	import WindowButtons from '$lib/components/customs/window-buttons.svelte';
	let { children } = $props();

	onMount(async () => {
		// load recents
		const rawData = localStorage.getItem('recent-notes') || '[]';
		let notesIds: string[] = JSON.parse(rawData);
		// remove the redundant notes from recents
		if (notesIds.length > 0)
			notesIds = notesIds.filter((noteId) => $NOTES.find((note) => note.id === noteId));
		RECENT_NOTES.set(notesIds);

		await APPWINDOW.show();
		const update = await check();
		if (update !== null) {
			toast.success(`New version ${update.version} is available.`, {
				action: {
					label: 'Update',
					onClick: () => {
						downloadAndInstall(update);
					}
				}
			});
		}
	});
</script>

<ModeWatcher />
<Sonner richColors />

<Commandbar />
<NewWorkSpace />

<SidebarPage>
	{#if OS === 'windows'}
		<WindowButtons />
	{/if}
	{@render children()}
</SidebarPage>
