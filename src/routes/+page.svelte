<script lang="ts">
	import { PUBLIC_NOTA_ARTIFACT_URL } from '$env/static/public';
	import ArtifactDownloader from '$lib/artifact/artifact-downloader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Github } from '@lucide/svelte';
</script>

<span class="bg-muted text-muted-foreground fixed top-0 right-0 z-50 p-2"> BETA </span>
<main class="flex h-screen w-screen flex-col items-center justify-center gap-8">
	<div class="flex items-center gap-4">
		<img src="/favicon.png" alt="Nota" class="mb-4 size-18" />
		<h1 class="animate-pulse text-7xl font-bold">Nota</h1>
	</div>
	<p class="animate-bounce">
		A fast, modern, feature rich, lightweight and local fist note taking desktop application
	</p>
	<div class="flex items-center gap-4">
		<Button variant="secondary" href="https://github.com/Tsuzat/Nota" target="_blank">
			<Github />
			Visit Github
		</Button>
		<ArtifactDownloader />
	</div>
</main>
