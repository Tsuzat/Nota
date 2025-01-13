<script lang="ts">
	import { goto } from '$app/navigation';
	import src from '$lib/assets/static/icon.png';
	import Navigation from '$lib/components/customs/navigation.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { APPWINDOW, RECENT_NOTES } from '$lib/contants';
	import { X } from 'lucide-svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		await APPWINDOW.setTitle('Nota - Home');
	});
</script>

<main>
	<header class="flex h-14 shrink-0 items-center gap-2">
		<div class="flex flex-1 items-center gap-2 px-3">
			<Sidebar.Trigger />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Navigation />
		</div>
	</header>
	<div class="flex flex-1 flex-col gap-4 p-2">
		<div class="mx-auto h-24 w-full max-w-3xl rounded-xl flex flex-col items-center justify-around">
			<div class="inline-flex items-center justify-center gap-4">
				<img {src} alt="App Logo" srcset="App Logo" class="size-8" />
				<span class="text-2xl font-bold">N O T A</span>
			</div>
			<div class="font-medium">Welcome to Nota - Your Note Taking App</div>
		</div>
		<div class="mx-auto w-full max-w-3xl rounded-xl p-4">
			<div class="text-sm text-muted-foreground">
				RECENT NOTES
				<span class="text-sm text-foreground font-medium">{$RECENT_NOTES.size}</span>
			</div>
			<div class="flex items-center gap-2 p-2 rounded-xl flex-wrap">
				{#each $RECENT_NOTES as note}
					<Button
						variant="outline"
						size="lg"
						class="flex items-center"
						onclick={() => {
							goto(`/${note.id}`);
						}}
					>
						<span class="text-xl">{note.name}</span>
						<span>{note.name}</span>
						<Button variant="ghost" size="icon" class="size-6 ml-auto">
							<X />
						</Button>
					</Button>
				{/each}
			</div>
		</div>
	</div>
</main>
