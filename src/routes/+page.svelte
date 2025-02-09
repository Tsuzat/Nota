<script lang="ts">
	import { APP_MENU } from '$lib/app_menu';
	import { SHOW_DECORATION, SIDEBAR_OPEN } from '$lib/app_settings';
	import src from '$lib/assets/static/icon.png';
	import Navigation from '$lib/components/customs/navigation.svelte';
	import RecentNotes from '$lib/components/customs/tiles/recent-notes.svelte';
	import Tooltip from '$lib/components/customs/tooltip.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { APPWINDOW, NOTES, OS } from '$lib/contants';
	import { clearRecents, RECENT_NOTES } from '$lib/recents';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	const sidebar = useSidebar();

	onMount(async () => {
		// load recents
		const rawData = localStorage.getItem('recent-notes') || '[]';
		let notesIds: string[] = JSON.parse(rawData);
		RECENT_NOTES.set(notesIds);

		sidebar.setOpen($SIDEBAR_OPEN);

		await APPWINDOW.setTitle('Nota - Home');
	});
</script>

<main>
	<header
		{...$SHOW_DECORATION ? {} : { 'data-tauri-drag-region': '' }}
		class={cn(
			'flex min-h-10 max-h-10 h-10 w-full items-center justify-between gap-2',
			$SHOW_DECORATION === false && 'mr-36'
		)}
	>
		<div class="flex items-center gap-2 px-3">
			{#if sidebar.state === 'collapsed'}
				{#if $SHOW_DECORATION}
					<img {src} alt="user-icon" class="size-5" />
				{:else}
					<Button variant="ghost" size="icon" class="size-6 p-1" onclick={() => APP_MENU.popup()}>
						<img {src} alt="user-icon" class="size-full" />
					</Button>
				{/if}
			{/if}
			<Tooltip text="Toggle Sidebar" key={`${OS === 'macos' ? '⌘' : 'Ctrl'} \\`}>
				<Sidebar.Trigger
					onclick={() => {
						SIDEBAR_OPEN.set(sidebar.state === 'collapsed');
					}}
				/>
			</Tooltip>
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
