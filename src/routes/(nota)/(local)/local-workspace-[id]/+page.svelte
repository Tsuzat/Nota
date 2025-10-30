<script lang="ts">
	import AppLogoMenu from '$lib/components/custom/app-logo-menu.svelte';
	import BackAndForthButtons from '$lib/components/custom/back-and-forth-buttons.svelte';
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
	import { cn, FileType, ISMACOS, ISTAURI, ISWINDOWS } from '$lib/utils';
	import Loader from '@lucide/svelte/icons/loader';
	import { type Content, type Editor } from '@tiptap/core';
	import { onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { DEFAULT_SETTINGS, type NotePageSettingsType } from '$lib/types';
	import { createFile, getAssetsByFileType, moveFileToAssets } from '$lib/local/utils';
	import SearchAndReplace from '$lib/components/edra/shadcn/components/toolbar/SearchAndReplace.svelte';
	import { beforeNavigate } from '$app/navigation';
	import { DB } from '$lib/local/db.js';
	import { getLocalWorkspaces } from '$lib/local/workspaces.svelte.js';
	import { resolve } from '$app/paths';

	const sidebar = useSidebar();

	// editor related
	let editor = $state<Editor>();
	let content = $state<Content>();
	let pendingContent = $state<Content>();

	const localWorkspaces = getLocalWorkspaces();
	let pageSettings = $state(DEFAULT_SETTINGS);

	const { data } = $props();

	$effect(() => {
		if (data.id) loadData(data.id);
	});

	let workspace = $derived(localWorkspaces.getWorkspaces().find((w) => String(w.id) === data.id));
	async function loadData(id: string) {
		isLoading = true;
		try {
			if (workspace === undefined) {
				toast.error(`Workspace with id ${id} not found`);
				return;
			}
			const data = await DB.select<{ content: string }[]>(
				'SELECT content FROM workspaces WHERE id = $1',
				[id]
			);
			if (data.length === 0) {
				toast.error(`Workspace content with id ${id} not found`);
				return;
			}
			content = JSON.parse(data[0].content) as Content;
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong when loading workspace');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		const saveInterval = setInterval(() => {
			if (pendingContent !== undefined && pendingContent !== null) {
				saveContent(pendingContent);
			}
		}, 1000);
		return () => clearInterval(saveInterval);
	});

	async function saveContent(content: Content) {
		if (workspace === undefined) return;
		await DB.execute('UPDATE workspaces SET content = $1 WHERE id = $2', [
			JSON.stringify(content),
			workspace.id
		]);
	}

	const onFileSelect = async (file: string) => moveFileToAssets(file);

	const onDropOrPaste = async (file: File) => createFile(file);

	const getAssets = async (fileType: FileType) => getAssetsByFileType(fileType);

	let isLoading = $state(false);

	async function updatePageSettings(settings: NotePageSettingsType) {
		// await saveToStore('settings', settings);
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

	beforeNavigate(() => {
		if (pendingContent !== undefined && pendingContent !== null) {
			saveContent(pendingContent);
		}
		pendingContent = undefined;
	});

	onDestroy(() => {
		editor?.destroy();
	});

	async function updateIcon(icon: string) {
		if (workspace === undefined) return;
		try {
			workspace = { ...workspace, icon };
			await localWorkspaces.updateWorkspace(workspace);
		} catch (e) {
			toast.error('Could not update note icon');
			console.error(e);
		}
	}

	async function updateName(name: string) {
		if (workspace === undefined) return;
		try {
			workspace = { ...workspace, name };
			await localWorkspaces.updateWorkspace(workspace);
		} catch (e) {
			toast.error('Could not update note name');
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
			const content = editor?.getJSON() as Content;
			toast.promise(saveContent(content), {
				loading: 'Saving the content to local DB',
				success: 'Content saved',
				error: (err) => {
					console.error(err);
					return 'Could not save content';
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
			<h4>Loading Local Workspace</h4>
		</div>
	</div>
{:else if !isLoading && workspace !== undefined}
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
					<IconRenderer icon={workspace.icon} />
				</div>
			</IconPicker>
			<input
				value={workspace.name}
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
		class="flex-1 flex-grow flex-col overflow-auto !p-8"
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
