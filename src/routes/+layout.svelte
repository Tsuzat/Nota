<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/dm-sans';
	import '../app.css';
	import SidebarPage from '$lib/components/customs/sidebar/sidebar-page.svelte';
	import { onMount } from 'svelte';
	import NewWorkSpace from '$lib/components/customs/dialogs/NewWorkSpace.svelte';
	import Sonner from '$lib/components/ui/sonner/sonner.svelte';
	import Commandbar from '$lib/components/customs/dialogs/commandbar.svelte';
	let { children } = $props();

	onMount(async () => {
		// load the data
	});
</script>

<ModeWatcher />
<Sonner richColors />

<Commandbar />
<NewWorkSpace />

<SidebarPage>
	{@render children()}
</SidebarPage>
