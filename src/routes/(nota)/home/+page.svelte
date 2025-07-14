<script lang="ts">
	import { browser } from '$app/environment';
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
	import NavActions from '$lib/components/custom/side-bar/nav-actions.svelte';
	import WindowsButtons from '$lib/components/custom/windows-buttons.svelte';
	import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '$lib/components/edra/shadcn';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { cn, ISMACOS, ISTAURI } from '$lib/utils';
	import type { Content, Editor } from '@tiptap/core';
	let content = $state<Content>();
	let editor = $state<Editor>();

	const sidebar = useSidebar();

	if (browser) {
		const raw = localStorage.getItem('content');
		if (raw) {
			content = JSON.parse(raw);
		} else {
			content = {};
		}
	}

	function onUpdate() {
		content = editor?.getJSON();
		localStorage.setItem('content', JSON.stringify(content));
	}
</script>

<header class="flex h-12 shrink-0 items-center gap-2">
	<div
		data-open={ISMACOS && sidebar.open}
		class="z-20 flex items-center gap-2 px-3 data-[open=false]:ml-18"
	>
		<SidebarTrigger />
		<BackAndForthButtons />
		<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
		<h3>My Notes</h3>
	</div>
	<div class={cn('z-20 ml-auto px-3', !ISMACOS && ISTAURI && 'mr-30')}>
		<NavActions />
	</div>
	{#if !ISMACOS && ISTAURI}
		<WindowsButtons />
	{/if}
</header>
<div class="flex h-[calc(100vh-3rem)] flex-1 flex-grow flex-col overflow-auto">
	<div class="mx-auto h-full w-full max-w-3xl">
		{#if editor && !editor?.isDestroyed}
			<EdraBubbleMenu {editor} />
			<EdraDragHandleExtended {editor} />
		{/if}
		<EdraEditor bind:editor {content} class="size-full !p-8" {onUpdate} />
	</div>
</div>
