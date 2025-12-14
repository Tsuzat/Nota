<script lang="ts">
import { onMount } from 'svelte';
import { resolve } from '$app/paths';
import { page } from '$app/state';

let counter = $state(3);

onMount(() => {
  const searchParams = page.url.searchParams;
  const code = searchParams.get('code');
  if (code) {
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
	<h2 class="animate-bounce font-semibold">Auth Success. (This Method is deprecated.)</h2>
    <p>Update the Nota app to use the new authentication method.</p>
	<div>
		You'll be redired to
		<a class="text-primary underline" href={resolve('/')}>home</a>
		in {counter} seconds
	</div>
</div>
