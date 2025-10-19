<script lang="ts">
	import AppLogoMenu from '$lib/components/custom/app-logo-menu.svelte';
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
	import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
	import { cn, FileType, ISMACOS, ISTAURI, ISWINDOWS } from '$lib/utils';
	import { Loader } from '@lucide/svelte';
	import type { Content, Editor } from '@tiptap/core';
	import { onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { DEFAULT_SETTINGS, type NotePageSettingsType } from '$lib/types';
	import { createFile, getAssetsByFileType, moveFileToAssets } from '$lib/local/utils';
	import SearchAndReplace from '$lib/components/edra/shadcn/components/toolbar/SearchAndReplace.svelte';
	import { load } from '@tauri-apps/plugin-store';
	import { dirname, resolve } from '@tauri-apps/api/path';
	import { migrateMathStrings } from '@tiptap/extension-mathematics';
	import { beforeNavigate } from '$app/navigation';

	const sidebar = useSidebar();

	// editor related
	let editor = $state<Editor>();
	let pendingContent = $state<Content>();

	const localNotes = getLocalNotes();
	let note = $state<LocalNote>();
	let assetsPath = $state<string>();
	let pageSettings = $state(DEFAULT_SETTINGS);

	const { data } = $props();

	$effect(() => {
		if (data.id) loadData(data.id);
	});

	async function loadData(id: string) {
		isLoading = true;
		pendingContent = undefined;
		note = localNotes.getNotes().find((n) => n.id === id);
		if (note === undefined) {
			toast.error('Note not found');
			isLoading = false;
			return;
		}
		const dirPath = await dirname(note.path);
		assetsPath = await resolve(dirPath, 'assets');
		const store = await load(note.path);
		const content = await store.get<Content>('content');
		if (content && editor) {
			editor.commands.setContent(content);
			migrateMathStrings(editor);
		}
		isLoading = false;
	}

	onMount(() => {
		const saveInterval = setInterval(() => {
			if (pendingContent !== undefined && pendingContent !== null) {
				saveToStore('content', pendingContent);
			}
		}, 1000);
		return () => clearInterval(saveInterval);
	});

	const onFileSelect = $derived.by(() => {
		if (assetsPath !== undefined) return;
		return async (file: string) => moveFileToAssets(file, assetsPath!);
	});

	const onDropOrPaste = $derived.by(() => {
		if (assetsPath === undefined) return;
		return async (file: File) => createFile(file, assetsPath!);
	});

	const getAssets = $derived.by(() => {
		if (assetsPath === undefined) return;
		return async (fileType: FileType) => getAssetsByFileType(fileType, assetsPath!);
	});

	let isLoading = $state(false);

	async function updatePageSettings(settings: NotePageSettingsType) {
		await saveToStore('settings', settings);
	}

	$effect(() => {
		updatePageSettings(pageSettings);
	});

	async function onUpdate() {
		try {
			pendingContent = editor?.getJSON();
		} catch (error) {
			console.error(error);
		}
	}

	beforeNavigate(async () => {
		/// Save before changing the route
		if (pendingContent !== undefined && pendingContent !== null) {
			await saveToStore('content', pendingContent);
		}
		pendingContent = undefined;
	});

	onDestroy(() => {
		editor?.destroy();
	});

	async function saveToStore(key: string, value: any) {
		if (note === undefined) {
			console.log('Can not save to a undefined store');
			return;
		}
		try {
			const store = await load(note.path);
			await store.set(key, value);
			await store.save();
			await store.close();
		} catch (e) {
			console.error(e);
			toast.error(`Unable to save ${key}`);
		}
	}

	async function updateIcon(icon: string) {
		if (note === undefined) return;
		try {
			note = { ...note, icon };
			await saveToStore('icon', icon);
			await localNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note icon');
			console.error(e);
		}
	}

	async function updateName(name: string) {
		if (note === undefined) return;
		try {
			note = { ...note, name };
			await saveToStore('name', name);
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
		if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
			event.preventDefault();
			pageSettings = { ...pageSettings, locked: !pageSettings.locked };
		}
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			const content = editor?.getJSON();
			toast.promise(saveToStore('content', content), {
				loading: 'Saving to local store',
				success: 'Note saved',
				error: (err) => {
					console.error(err);
					return 'Could not save note';
				},
				duration: 1000
			});
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if isLoading}
	<div class="flex size-full flex-col items-center justify-center">
		<div class="flex items-center gap-4">
			<Loader class="text-primary animate-spin" />
			<h4>Loading Local Notes</h4>
		</div>
	</div>
{:else if !isLoading && note !== undefined}
	<header class="flex h-12 shrink-0 items-center gap-2">
		<div
			class={cn(
				'z-20 ml-18 flex items-center gap-2 px-3',
				ISMACOS && !sidebar.open && 'ml-18',
				ISWINDOWS && !sidebar.open && 'ml-0',
				(ISMACOS || ISWINDOWS) && ISTAURI && sidebar.open && 'md:ml-0'
			)}
		>
			{#if ISWINDOWS && !sidebar.open}
				<AppLogoMenu />
			{/if}
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

		<div class={cn('z-20 ml-auto flex items-center gap-2 px-3', ISWINDOWS && 'mr-30')}>
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
		{#if ISWINDOWS}
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
