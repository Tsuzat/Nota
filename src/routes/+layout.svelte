<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/dm-sans';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import { ISTAURI } from '$lib/utils';

	let { children } = $props();

	onMount(() => {
		if (ISTAURI) {
			toast.info("Inside Tauri's window");
		} else {
			toast.info('Inside the browser');
		}
	});
</script>

<Toaster richColors closeButton position="top-right" />

<ModeWatcher />

{@render children()}
