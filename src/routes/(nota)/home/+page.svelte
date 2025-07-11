<script lang="ts">
	import { browser } from '$app/environment';
	import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '$lib/components/edra/shadcn';
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

{#if editor && !editor?.isDestroyed}
	<EdraBubbleMenu {editor} />
	<EdraDragHandleExtended {editor} />
{/if}
<EdraEditor bind:editor {content} class="size-full !p-8" {onUpdate} />
