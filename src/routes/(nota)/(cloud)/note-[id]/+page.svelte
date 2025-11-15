<script lang="ts">
	import AppLogoMenu from '$lib/components/custom/app-logo-menu.svelte';
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { useCloudNotes, type CloudNote } from '$lib/supabase/db/cloudnotes.svelte.js';
	import { supabase } from '$lib/supabase/index.js';
	import { cn, FileType, ISMACOS, ISTAURI, ISWINDOWS } from '$lib/utils';
	import { type Content, Editor } from '@tiptap/core';
	import { toast } from 'svelte-sonner';
	import { beforeNavigate, goto } from '$app/navigation';
	import IconPicker from '$lib/components/icons/icon-picker.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import IconRenderer from '$lib/components/icons/icon-renderer.svelte';
	import SearchAndReplace from '$lib/components/edra/shadcn/components/toolbar/SearchAndReplace.svelte';
	import NavActions from '$lib/components/custom/side-bar/nav-actions.svelte';
	import WindowsButtons from '$lib/components/custom/windows-buttons.svelte';
	import {
		EdraBubbleMenu,
		EdraDragHandleExtended,
		EdraEditor,
		EdraToolBar
	} from '$lib/components/edra/shadcn/index.js';
	import Cloud from '@lucide/svelte/icons/cloud';
	import Loader from '@lucide/svelte/icons/loader';
	import { DEFAULT_SETTINGS } from '$lib/types.js';
	import { onMount } from 'svelte';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';
	import { getAssetsByFileType, uploadFile, uploadFileByPath } from '$lib/supabase/storage.js';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte.js';
	import { resolve } from '$app/paths';
	import { derived } from 'svelte/store';

	const { data } = $props();

	$effect(() => {
		if (data.id) loadData(data.id);
	});

	const sidebar = useSidebar();

	// editor related
	let editor = $state<Editor>();
	let content = $state<Content>();
	let pendingContent = $state<Content | null>(null);

	// cloud related
	const cloudNotes = useCloudNotes();
	const user = $derived(getSessionAndUserContext().getUser());

	// notes related
	let isLoading = $state(false);
	let note = $state<CloudNote>();
	let pageSettings = $derived(data.settings ?? DEFAULT_SETTINGS);
	let syncing = $state(false);

	const onFileSelect = $derived.by(() => {
		if (user) return (file: string) => uploadFileByPath(user.id, file);
	});

	const onDropOrPaste = $derived.by(() => {
		if (user) return (file: File) => uploadFile(user.id, file);
	});

	const getAssets = $derived.by(() => {
		if (user) return async (fileType: FileType) => getAssetsByFileType(user.id, fileType);
	});

	async function saveNoteContent() {
		if (pendingContent === null || note === undefined) return;
		syncing = true;
		try {
			const { error } = await supabase
				.from('notes')
				.update({ content: pendingContent })
				.eq('id', note.id);
			if (error) {
				console.error(error);
				toast.error(error.message);
			}
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when saving content to cloud');
		} finally {
			syncing = false;
		}
	}

	onMount(() => {
		// auto save is called in every 2 mins
		const saveInterval = setInterval(() => {
			if (pendingContent !== null) {
				saveNoteContent();
			}
		}, 120000);
		return () => clearInterval(saveInterval);
	});

	function updatePageSettings() {
		localStorage.setItem('pageSettings', JSON.stringify(pageSettings));
	}

	$effect(() => {
		if (pageSettings) updatePageSettings();
	});

	async function loadData(id: string) {
		isLoading = true;
		note = cloudNotes.getNotes().find((n) => n.id === id);
		try {
			const { data, error } = await supabase.from('notes').select('content').eq('id', id).single();
			if (error) {
				console.error(error);
				toast.error(error.message);
				goto(resolve('/home'));
			}
			if (data) {
				content = data.content as Content;
			}
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when loading notes');
			goto(resolve('/home'));
		} finally {
			isLoading = false;
		}
	}

	async function onUpdate() {
		try {
			pendingContent = editor?.getJSON() as Content;
		} catch (error) {
			console.error(error);
		}
	}

	async function updateIcon(icon: string) {
		if (note === undefined) return;
		syncing = true;
		try {
			note = { ...note, icon };
			await cloudNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note icon');
			console.error(e);
		} finally {
			syncing = false;
		}
	}

	async function updateName(name: string) {
		if (note === undefined) return;
		syncing = true;
		try {
			note = { ...note, name };
			await cloudNotes.updateNote(note);
		} catch (e) {
			toast.error('Could not update note name');
			console.error(e);
		} finally {
			syncing = false;
		}
	}

	async function toggleStar() {
		if (note === undefined) return;
		syncing = true;
		try {
			note = { ...note, favorite: !note.favorite };
			await cloudNotes.toggleFavorite(note.id);
		} catch (e) {
			toast.error('Could not update note starred');
			console.error(e);
		} finally {
			syncing = false;
		}
	}

	beforeNavigate(async () => {
		if (pendingContent !== null) {
			await saveNoteContent();
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			saveNoteContent();
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if isLoading}
	<div class="flex size-full flex-col items-center justify-center">
		<div class="flex items-center gap-4">
			<Loader class="text-primary animate-spin" />
			<h4>Loading Cloud Notes</h4>
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
				<div class={buttonVariants({ variant: 'ghost', class: 'size-7! p-1' })}>
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
				<div class="text-muted-foreground truncate text-xs">
					{editor.storage.characterCount.words()} Words
				</div>
				<SearchAndReplace {editor} />
			{/if}
			<SimpleTooltip content={syncing ? 'Syncing' : 'Synced'}>
				<Button variant="ghost" size="icon" class="size-7">
					{#if syncing}
						<Loader class="text-primary animate-spin" />
					{:else}
						<Cloud />
					{/if}
				</Button>
			</SimpleTooltip>
			<NavActions
				starred={note.favorite as boolean}
				{toggleStar}
				bind:settings={pageSettings}
				{editor}
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
	{#if editor && !editor?.isDestroyed}
		{#if pageSettings.showbubblemenu}
			<EdraBubbleMenu {editor} />
		{/if}
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
{:else}
	<div class="flex size-full flex-col items-center justify-center gap-4">
		<h4>Something went wrong.</h4>
		<a href={resolve('/home')}>Got to Home</a>
	</div>
{/if}
