<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/dm-sans';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();

	onMount(() => {});
</script>

<Toaster richColors closeButton position="top-right" />

<ModeWatcher />

{@render children()}
