<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();

	onMount(() => {});
</script>

<Toaster richColors closeButton />

<ModeWatcher />

{@render children()}
