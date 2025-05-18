<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/open-sans';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />
<main class="h-screen w-screen">
	{@render children()}
</main>
