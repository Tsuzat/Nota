<script lang="ts">
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';
	import ToggleMode from '$lib/components/custom/toggle-mode.svelte';
	import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '$lib/components/edra/shadcn';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { FileType } from '$lib/utils';
	import { Key, Trash } from '@lucide/svelte';
	import type { Editor } from '@tiptap/core';
	import { onMount } from 'svelte';
	import defalutContent from './demo';

	let content = $state(defalutContent);
	let editor = $state<Editor>();
	let hasAPIKEY = $state(localStorage.getItem('gemini_api_key') !== null);

	onMount(() => {
		content = JSON.parse(localStorage.getItem('nota-playground-content') ?? '{}');
		editor?.commands.setContent(content);
	});

	function onUpdate() {
		localStorage.setItem('nota-playground-content', JSON.stringify(editor?.getJSON()));
	}

	const onFileSelect = async (file: string) => {
		throw new Error('This is not available for Playground');
	};

	const onDropOrPaste = async (file: File) => {
		throw new Error('This is not available for Playground');
	};

	const getAssets = async (fileType: FileType) => {
		throw new Error('This is not available for Playground');
	};

	const setGeminiAPIKey = () => {
		const key = prompt(
			'To use AI features, please input your Gemini API Key. This will be stored in your localStore so you might want to delete the key later on'
		);
		if (key) {
			localStorage.setItem('gemini_api_key', key);
			hasAPIKEY = true;
		}
	};
</script>

<main class="flex h-screen w-full flex-col overflow-hidden">
	<header class="relative mx-auto flex h-12 w-full max-w-3xl items-center justify-center gap-2">
		<span class="text-center text-2xl font-bold"> Nota Playground </span>
		<div class="right-0 ml-auto flex items-center gap-2">
			{#if hasAPIKEY}
				<SimpleTooltip content="Delete Gemini API Key">
					<Button
						variant="destructive"
						size="icon-sm"
						onclick={() => {
							localStorage.removeItem('gemini_api_key');
							hasAPIKEY = false;
						}}
					>
						<Trash />
					</Button>
				</SimpleTooltip>
			{:else}
				<SimpleTooltip content="Set Gemini API Key">
					<Button variant="ghost" size="icon-sm" class="ml-auto" onclick={setGeminiAPIKey}>
						<Key />
					</Button>
				</SimpleTooltip>
			{/if}
			<ToggleMode />
		</div>
	</header>
	{#if editor && !editor?.isDestroyed}
		<EdraBubbleMenu {editor} />
		<EdraDragHandleExtended {editor} />
	{/if}
	<EdraEditor
		bind:editor
		{content}
		class="flex-1 grow flex-col overflow-auto p-8!"
		{onUpdate}
		{onFileSelect}
		{onDropOrPaste}
		{getAssets}
	/>
</main>
