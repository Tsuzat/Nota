<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/dm-sans';
	import '../app.css';
	let { children } = $props();
</script>

<ModeWatcher />

{@render children()}
