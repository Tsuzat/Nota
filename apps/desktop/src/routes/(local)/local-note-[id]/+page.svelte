<script lang="ts">
import type { FileType } from '@lib/components/edra/utils.js';
import { toast } from '@lib/components/ui/sonner/index.js';
import { cn } from '@lib/utils.js';
import SearchAndReplace from '@nota/ui/edra/shadcn/components/toolbar/SearchAndReplace.svelte';
import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor, EdraToolBar } from '@nota/ui/edra/shadcn/index.js';
import type { Content, Editor } from '@nota/ui/edra/types.js';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { buttonVariants } from '@nota/ui/shadcn/button';
import { Separator } from '@nota/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@nota/ui/shadcn/sidebar';
import { onDestroy, onMount } from 'svelte';
import { beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import AppLogoMenu from '$lib/components/app-menu.svelte';
import BackAndForthButtons from '$lib/components/back-and-forth-buttons.svelte';
import AI from '$lib/components/editor/AI.svelte';
import { getGlobalSettings } from '$lib/components/settings/constants.svelte.js';
import NavActions from '$lib/components/sidebar/nav-actions.svelte';
import WindowsButtons from '$lib/components/windows-buttons.svelte';
import { DB } from '$lib/local/db.js';
import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { createFile, getAssetsByFileType, moveFileToAssets, selectLocalFile } from '$lib/local/util.js';
import { ISMACOS, ISWINDOWS } from '$lib/utils';

const sidebar = useSidebar();

// editor related
let editor = $state<Editor>();
let element = $state<HTMLElement>();
let content = $state<Content>();
let pendingContent = $state<Content>();

const localNotes = getLocalNotes();
const globalSettings = getGlobalSettings();

const { data } = $props();

$effect(() => {
  if (data.id) loadData();
});

let note = $state<LocalNote>();

async function loadData() {
  isLoading = true;
  const id = data.id;
  note = localNotes.getNotes().find((n) => n.id === id);
  if (note === undefined) {
    toast.error(`Notes with id ${id} not found`);
    return goto(resolve('/'));
  }
  try {
    const data = await DB.select<{ content: string }[]>('SELECT content FROM notes WHERE id = $1', [id]);
    if (data.length === 0) {
      toast.error(`Notes content with id ${id} not found`);
      return goto(resolve('/'));
    }
    content = JSON.parse(data[0].content) as Content;
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading notes');
  } finally {
    isLoading = false;
  }
}

onMount(() => {
  const saveInterval = setInterval(() => {
    if (pendingContent !== undefined && pendingContent !== null) {
      saveContent();
    }
  }, 5000);
  return () => clearInterval(saveInterval);
});

async function saveContent() {
  if (note === undefined || pendingContent === undefined || pendingContent === null) return;
  await DB.execute('UPDATE notes SET content = $1 WHERE id = $2', [JSON.stringify(pendingContent), note.id]);
  pendingContent = null;
}

const onFileSelect = async (file: string) => moveFileToAssets(file);

const onDropOrPaste = async (file: File) => createFile(file);

const getAssets = async (fileType: FileType) => getAssetsByFileType(fileType);

const getLocalFile = async (fileType: FileType) => selectLocalFile(fileType);

let isLoading = $state(false);

async function onUpdate() {
  try {
    pendingContent = editor?.getJSON();
  } catch (error) {
    console.error(error);
  }
}

beforeNavigate(() => {
  if (pendingContent !== undefined && pendingContent !== null) {
    saveContent();
  }
  pendingContent = undefined;
});

onDestroy(() => {
  editor?.destroy();
});

async function updateIcon(icon: string) {
  if (note === undefined) return;
  try {
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
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    pendingContent = editor?.getJSON() as Content;
    toast.promise(saveContent(), {
      loading: 'Saving to local store',
      success: 'Note saved',
      error: (err) => {
        console.error(err);
        return 'Could not save note';
      },
      duration: 1000,
    });
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if isLoading}
	<div class="flex size-full flex-col items-center justify-center">
		<div class="flex items-center gap-4">
			<icons.Loader class="text-primary animate-spin" />
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
				sidebar.open && 'md:ml-0'
			)}
		>
			{#if ISWINDOWS && !sidebar.open}
				<AppLogoMenu />
			{/if}
			<SidebarTrigger />
			<BackAndForthButtons />
			<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
			<IconPicker onSelect={updateIcon}>
				<div class={buttonVariants({ variant: 'ghost', size: "icon-sm" })}>
					<IconRenderer icon={note.icon} />
				</div>
			</IconPicker>
			<input
				value={note.name}
				class="hover:bg-muted truncate rounded px-1 py-0.5 text-lg font-bold focus:outline-none"
				onchange={async (e) => {
					const target = e.target as HTMLInputElement;
					const value = target.value;
					if (value.trim() === '') return;
					e.preventDefault();
					await updateName(target.value);
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
			<NavActions starred={note.favorite as boolean} {toggleStar} {editor} {note} />
		</div>
		{#if ISWINDOWS}
			<WindowsButtons />
		{/if}
	</header>
	{#if globalSettings.useToolBar && editor}
		<EdraToolBar {editor} />
	{/if}
	{#if editor && !editor?.isDestroyed}
		{#if globalSettings.useBubbleMenu}
			<EdraBubbleMenu {editor} />
		{/if}
		{#if globalSettings.useDragHandle}
			<EdraDragHandleExtended {editor} />
		{/if}
    <AI {editor} parentElement={element} />
	{/if}
	<EdraEditor
		bind:editor
    bind:element
		{content}
		class="flex-1 grow flex-col overflow-auto p-8!"
		{onUpdate}
		{onFileSelect}
		{onDropOrPaste}
		{getAssets}
    {getLocalFile}
	/>
{:else}
	<div class="flex size-full flex-col items-center justify-center gap-4">
		<h4>Something went wrong.</h4>
		<a href={resolve('/')}>Got to Home</a>
	</div>
{/if}
