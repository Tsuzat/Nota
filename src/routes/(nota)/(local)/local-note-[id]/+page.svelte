<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
	import NavActions from '$lib/components/custom/side-bar/nav-actions.svelte';
	import WindowsButtons from '$lib/components/custom/windows-buttons.svelte';
	import {
		EdraBubbleMenu,
		EdraDragHandleExtended,
		EdraEditor,
		EdraToolBar
	} from '$lib/components/edra/shadcn';
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { cn, FileType, ISMACOS, ISTAURI } from '$lib/utils';
	import { Loader } from '@lucide/svelte';
	import type { Editor } from '@tiptap/core';
	import { onDestroy, untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { DEFAULT_SETTINGS } from '$lib/types';
	import { createFile, getAssetsByFileType, moveFilesToAssets } from '$lib/local/utils';
	import SearchAndReplace from '$lib/components/edra/shadcn/components/toolbar/SearchAndReplace.svelte';

	const sidebar = useSidebar();

	let editor = $state<Editor>();
	const { data } = $props();

	const localNotes = getLocalNotes();
	let note = $derived(data.note);
	let store = $derived(data.store);
	let content = $derived(data.content);

	const onFileSelect = $derived.by(() => {
		if (data.assetsPath === undefined) return;
		return async (files: string[]) => moveFilesToAssets(files, data.assetsPath);
	});

	const onDropOrPaste = $derived.by(() => {
		if (data.assetsPath === undefined) return;
		return async (file: File) => createFile(file, data.assetsPath);
	});

	const getAssets = $derived.by(() => {
		if (data.assetsPath === undefined) return;
		return async (fileType: FileType) => getAssetsByFileType(fileType, data.assetsPath);
	});

	$effect(() => {
		untrack(() => editor)?.commands.setContent(data.content ?? null);
	});

	let isLoading = $state(false);

	let pageSettings = $derived(data.settings ?? DEFAULT_SETTINGS);

	$effect(() => {
		untrack(() => store)
			?.set('settings', pageSettings)
			.then(() => {
				store?.save();
			});
	});

	$effect(() => {
		untrack(() => editor)?.setEditable(!pageSettings.locked);
	});

	async function onUpdate() {
		try {
			const content = editor?.getJSON();
			await store?.set('content', content);
			await store?.save();
		} catch (error) {
			console.error(error);
		}
	}

	beforeNavigate(async () => {
		// editor?.destroy();
		await store?.save();
		await store?.close();
	});
	onDestroy(() => {
		editor?.destroy();
		store?.close();
	});

	async function updateIcon(icon: string) {
		if (note === undefined) return;
		try {
			await store?.set('icon', icon);
			await store?.save();
			note = { ...note, icon };
			await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note icon');
			console.error(e);
		}
	}

	async function updateName(name: string) {
		if (note === undefined) return;
		try {
			await store?.set('name', name);
			await store?.save();
			note = { ...note, name };
			await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note name');
			console.error(e);
		}
	}

	async function toggleStar() {
		if (note === undefined) return;
		try {
			note = { ...note, favorite: !note.favorite };
			await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note starred');
			console.error(e);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.metaKey && event.key === 'l') {
			event.preventDefault();
			pageSettings = { ...pageSettings, locked: !pageSettings.locked };
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if note === undefined && isLoading}
	<div class="flex size-full flex-col items-center justify-center">
		<div class="flex items-center gap-4">
			<Loader class="text-primary animate-spin" />
			<h4>Loading Local Notes</h4>
		</div>
	</div>
{:else if note !== undefined}
	<header class="flex h-12 shrink-0 items-center gap-2">
		<div
			data-open={ISMACOS && sidebar.open}
			class={cn(
				'z-20 ml-18 flex items-center gap-2 px-3 data-[open=false]:ml-18',
				ISTAURI && 'md:ml-0'
			)}
		>
			<SidebarTrigger />
			<BackAndForthButtons />
			<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
			<IconPicker onSelect={updateIcon}>
				<div class={buttonVariants({ variant: 'ghost', class: '!size-7 p-1' })}>
					<IconRenderer icon={note.icon} />
				</div>
			</IconPicker>
			<input
				value={note.name}
				class="hover:bg-muted truncate rounded px-1 py-0.5 text-lg font-bold focus:outline-none"
				onchange={(e) => {
					const target = e.target as HTMLInputElement;
					const value = target.value;
					if (value.trim() === '') return;
					updateName(target.value);
				}}
			/>
		</div>

		<div class={cn('z-20 ml-auto flex items-center gap-2 px-3', !ISMACOS && ISTAURI && 'mr-30')}>
			{#if editor && !editor?.isDestroyed}
				<SearchAndReplace {editor} />
			{/if}
			<NavActions
				starred={note.favorite as boolean}
				{toggleStar}
				bind:settings={pageSettings}
				{note}
			/>
		</div>
		{#if !ISMACOS && ISTAURI}
			<WindowsButtons />
		{/if}
	</header>
	{#if pageSettings.showtoolbar && editor}
		<EdraToolBar {editor} />
	{/if}
	<div class="flex h-[calc(100vh-3rem)] flex-1 flex-grow flex-col overflow-auto">
		<div class="mx-auto h-full w-full max-w-3xl flex-1 flex-grow">
			{#if editor && !editor?.isDestroyed}
				{#if pageSettings.showbubblemenu}
					<EdraBubbleMenu {editor} />
				{/if}
				<EdraDragHandleExtended {editor} />
			{/if}
			<EdraEditor
				bind:editor
				{content}
				class="size-full !p-8"
				{onUpdate}
				{onFileSelect}
				{onDropOrPaste}
				{getAssets}
			/>
		</div>
	</div>
{:else}
	<div class="flex size-full flex-col items-center justify-center gap-4">
		<h4>Something went wrong.</h4>
		<a href="/home">Got to Home</a>
	</div>
{/if}
