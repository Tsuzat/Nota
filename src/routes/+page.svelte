<script lang="ts">
	import ArtifactDownloader from '$lib/artifact/artifact-downloader.svelte';
	import ToggleMode from '$lib/components/custom/toggle-mode.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Github } from '@lucide/svelte';
</script>

<ToggleMode />

<main class="flex size-full flex-col items-center justify-center gap-8 overflow-auto">
	<div class="relative flex items-center gap-4">
		<span class="text-muted-foreground absolute bottom-1 left-1 rounded-full p-1 text-sm">
			BETA
		</span>
		<img src="/favicon.webp" alt="Nota" class="mb-4 size-18" />
		<h1 class="animate-pulse text-7xl font-bold">Nota</h1>
	</div>
	<p class="animate-bounce">
		A fast, modern, feature rich, lightweight and local first note taking desktop application
	</p>
	<div class="flex items-center gap-4">
		<Button variant="secondary" href="https://github.com/Tsuzat/Nota" target="_blank">
			<Github />
			Visit Github
		</Button>
		<ArtifactDownloader />
	</div>
	<img
		class="hidden aspect-auto h-auto max-w-4xl dark:block"
		src="https://github.com/user-attachments/assets/ceeaf70d-bf58-4b9e-96bd-f23f2b3f2235"
		alt="nota"
	/>

	<img
		class="block aspect-auto h-auto max-w-4xl dark:hidden"
		src="https://github.com/user-attachments/assets/2b1265a0-babc-47ad-aad6-f62b36e5f681"
		alt="nota"
	/>
</main>
