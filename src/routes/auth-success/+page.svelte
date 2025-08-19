<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let counter = $state(3);

	onMount(() => {
		const searchParams = page.url.searchParams;
		const desktop = searchParams.get('desktop') === 'true';
		const code = searchParams.get('code');
		if (desktop) {
			const deepLink = `nota://auth/callback?code=${code}`;
			window.location.href = deepLink;
		}
		const interval = setInterval(() => {
			counter -= 1;
			if (counter <= 0) {
				window.location.replace('/');
			}
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<div data-tauri-drag-handle class="flex h-screen w-full flex-col items-center justify-center gap-4">
	<h2 class="animate-bounce font-semibold">Auth Success</h2>
	<div>
		You'll be redired to
		<a class="text-primary underline" href="/">home</a>
		in {counter} seconds
	</div>
</div>
