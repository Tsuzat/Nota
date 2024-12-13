<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/dm-sans';
	import '../app.css';
	import SidebarPage from '$lib/components/customs/sidebar/sidebar-page.svelte';
	import { onMount } from 'svelte';
	import { initializeApplication } from '$lib/utils';
	let { children } = $props();

	onMount(async () => {
		// load the data
		initializeApplication();
	});
</script>

<ModeWatcher />

<SidebarPage>
	{@render children()}
</SidebarPage>
