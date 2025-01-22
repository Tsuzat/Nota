<script lang="ts">
	import src from '$lib/assets/static/icon.png';
	import Navigation from '$lib/components/customs/navigation.svelte';
	import RecentNotes from '$lib/components/customs/tiles/recent-notes.svelte';
	import Tooltip from '$lib/components/customs/tooltip.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { APPWINDOW, NOTES, OS } from '$lib/contants';
	import { clearRecents, RECENT_NOTES } from '$lib/recents';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	onMount(async () => {
		await APPWINDOW.setTitle('Nota - Home');
	});
</script>

<main>
	<header class="flex h-12 shrink-0 items-center gap-2">
		<div class="flex flex-1 items-center gap-2 px-3">
			<Tooltip text="Toggle Sidebar" key={`${OS === 'macos' ? '⌘' : 'Ctrl'} \\`}>
				<Sidebar.Trigger />
			</Tooltip>
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
			{#if $RECENT_NOTES}
				<div
					transition:fly={{ duration: 300 }}
					class="text-sm text-muted-foreground inline-flex items-center w-full"
				>
					<span> RECENT NOTES </span>
					<span class="text-sm text-foreground font-medium mx-2">{$RECENT_NOTES.length}</span>
					<span class="ml-auto">
						<Tooltip text="Clear all recent notes" delayDuration={100}>
							<Button variant="outline" size="sm" onclick={clearRecents}>Clear All</Button>
						</Tooltip>
					</span>
				</div>
				<div class="flex gap-2 p-2 rounded-xl flex-wrap">
					{#each $NOTES.filter((n) => $RECENT_NOTES.includes(n.id)) as note}
						<RecentNotes {note} />
					{/each}
				</div>
			{/if}
		</div>
	</div>
</main>
