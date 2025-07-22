<script lang="ts">
	import ArtifactDownloader from '$lib/artifact/artifact-downloader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Github } from '@lucide/svelte';
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center gap-8">
	<span class="bg-muted text-muted-foreground rounded-lg p-2"> BETA </span>
	<div class="flex items-center gap-4">
		<img src="/favicon.png" alt="Nota" class="mb-4 size-18" />
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
</main>
