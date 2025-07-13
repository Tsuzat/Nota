<script lang="ts">
	import { browser } from '$app/environment';
	import NavActions from '$lib/components/custom/side-bar/nav-actions.svelte';
	import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '$lib/components/edra/shadcn';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger } from '$lib/components/ui/sidebar';
	import type { Content, Editor } from '@tiptap/core';
	let content = $state<Content>();
	let editor = $state<Editor>();

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

<header class="flex h-14 shrink-0 items-center gap-2">
	<div class="flex flex-1 items-center gap-2 px-3">
		<SidebarTrigger />
		<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
		<h3>My Notes</h3>
	</div>
	<div class="ml-auto px-3">
		<NavActions />
	</div>
</header>
<div class="flex h-[calc(100vh-4rem)] flex-1 flex-grow flex-col overflow-auto">
	<div class="mx-auto h-full w-full max-w-3xl">
		{#if editor && !editor?.isDestroyed}
			<EdraBubbleMenu {editor} />
			<EdraDragHandleExtended {editor} />
		{/if}
		<EdraEditor bind:editor {content} class="size-full !p-8" {onUpdate} />
	</div>
</div>
