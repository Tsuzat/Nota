<script lang="ts">
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { useCloudNotes, type CloudNote } from '$lib/supabase/db/cloudnotes.svelte.js';
	import { supabase } from '$lib/supabase/index.js';
	import { cn, FileType, ISMACOS, ISTAURI } from '$lib/utils';
	import { type Content, Editor } from '@tiptap/core';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
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
	import { Cloud, Loader } from '@lucide/svelte';
	import { DEFAULT_SETTINGS } from '$lib/types.js';
	import { onMount } from 'svelte';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';
	import { getAssetsByFileType, uploadFile, uploadFileByPath } from '$lib/supabase/storage.js';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte.js';

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
	let pageSettings = $state(DEFAULT_SETTINGS);
	let syncing = $state(false);

	const onFileSelect = $derived.by(() => {
		if (user) return async (file: string) => uploadFileByPath(user.id, file);
	});

	const onDropOrPaste = $derived.by(() => {
		if (user) return async (file: File) => uploadFile(user.id, file);
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
		const saveInterval = setInterval(() => {
			if (pendingContent !== null) {
				saveNoteContent();
			}
		}, 5000);
		return () => clearInterval(saveInterval);
	});

	async function loadData(id: string) {
		isLoading = true;
		note = undefined;
		try {
			const { data, error } = await supabase.from('notes').select().eq('id', id).single();
			if (error) {
				console.error(error);
				toast.error(error.message);
			}
			if (data) {
				note = data;
				if (note) content = note.content;
			}
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when loading notes');
			goto('/home');
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
</script>

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
			class={cn(
				'z-20 ml-18 flex items-center gap-2 px-3',
				ISMACOS && !sidebar.open && 'ml-18',
				ISMACOS && ISTAURI && sidebar.open && 'md:ml-0'
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
				{onUpdate}
				class="size-full !p-8"
				{onDropOrPaste}
				{onFileSelect}
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
