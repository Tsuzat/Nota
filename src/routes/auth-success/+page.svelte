<script lang="ts">
	import { onMount } from 'svelte';

	let counter = $state(5);

	$effect(() => {
		if (counter <= 0) {
			window.location.replace('/');
		}
	});

	onMount(() => {
		const interval = setInterval(() => {
			counter -= 1;
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<div data-tauri-drag-handle class="flex h-screen w-full flex-col items-center justify-center gap-4">
	<h2>Auth Success</h2>
	<div>
		You'll be redired to
		<a class="text-primary underline" href="/">home</a>
		in {counter} seconds
	</div>
</div>
