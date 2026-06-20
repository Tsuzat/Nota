<script lang="ts">
import { getNotesContext, getStorageContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import SearchAndReplace from '@nota/ui/edra/shadcn/components/toolbar/SearchAndReplace.svelte';
import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor, EdraToolBar } from '@nota/ui/edra/shadcn/index.js';
import type { Content, Editor } from '@nota/ui/edra/types.js';
import { type FileType, getFileTypeExtensions, getFileTypeFromExtension } from '@nota/ui/edra/utils.js';
import { BarSpinner, IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { Skeleton } from '@nota/ui/shadcn/skeleton';
import { toast } from '@nota/ui/shadcn/sonner';
import { compare } from 'fast-json-patch';
import { onMount } from 'svelte';
import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import NavActions from '$lib/components/nav-actions.svelte';
import Topbar from '$lib/components/topbar.svelte';
import AI from '$lib/editor/Ai.svelte';

const { data } = $props();

afterNavigate(() => {
  if (data.id) loadData();
});

// editor related
let editor = $state<Editor>();
let element = $state<HTMLElement>();
let content = $state<Content>();
let syncedContent = $state<Content>();
let isDirty = $state(false);

// settings related
let useToolBar = $state(localStorage.getItem('use-toolbar') !== 'false');
let useBubbleMenu = $state(localStorage.getItem('use-bubble-menu') !== 'false');
let useDragHandle = $state(localStorage.getItem('use-drag-handle') !== 'false');

$effect(() => {
  localStorage.setItem('use-toolbar', String(useToolBar));
});
$effect(() => {
  localStorage.setItem('use-bubble-menu', String(useBubbleMenu));
});
$effect(() => {
  localStorage.setItem('use-drag-handle', String(useDragHandle));
});

// cloud related
const cloudNotes = getNotesContext();
const cloudStorage = getStorageContext();

// notes related
let isLoading = $state(false);
let note = $state<Note>();
let syncing = $state(false);
let syncingText = $state('');

const onFileSelect = async (_path: string) => {
  // Paths are Tauri-specific, so on web this is not typically called, but we stub it
  return '';
};

const onDropOrPaste = async (file: File) => await cloudStorage.upload(file);

const getAssets = async (fileType: FileType) => {
  const files = cloudStorage.files;
  const extensions = new Set(getFileTypeExtensions(fileType));
  const assets: string[] = [];
  for (const file of files) {
    const key = file.key;
    const fileExtension = key.split('.').pop();
    if (fileExtension !== undefined && extensions.has(fileExtension)) {
      assets.push(file.url);
    }
  }
  return assets;
};

const getLocalFile = async (fileType: FileType) => {
  const extensions = getFileTypeExtensions(fileType);
  return new Promise<string | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = extensions.map((ext) => `.${ext}`).join(',');
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const url = await cloudStorage.upload(file);
        resolve(url);
      } catch (e) {
        console.error(e);
        toast.error('Failed to upload file');
        resolve(null);
      }
    };
    input.onerror = () => resolve(null);
    input.oncancel = () => resolve(null);
    input.click();
  });
};

async function saveNoteContent() {
  if (!isDirty || note === undefined || editor === undefined) return;

  const currentContent = editor.getJSON();
  if (syncedContent === undefined || syncedContent === null || typeof syncedContent === 'string') {
    syncedContent = {};
  }
  const patch = compare(syncedContent as object, currentContent);

  if (patch.length === 0) {
    isDirty = false;
    return;
  }

  syncing = true;
  syncingText = `Syncing ${patch.length} changes`;
  try {
    await cloudNotes.patch(note.id, patch);
    syncedContent = currentContent;
    isDirty = false;
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
    saveNoteContent();
  }, 120000);
  return () => clearInterval(saveInterval);
});

// Polyfill fixMathReplacer inline to avoid external tauri-specific import
function fixMathReplacer(parsedContent: Content): {
  content: Content;
  replaced: boolean;
} {
  let replaced = false;
  let content = parsedContent;
  function walk(node: any): any {
    if (node === null || node === undefined || typeof node !== 'object') return node;
    if (node.type === 'inlineMathReplacer') {
      node.type = 'inlineMath';
      replaced = true;
    }
    if (Array.isArray(node.content)) {
      node.content = node.content.map(walk);
    }
    return node;
  }
  if (Array.isArray(content)) {
    content = content.map(walk) as Content;
  } else {
    walk(content);
  }
  return { content, replaced };
}

async function loadData() {
  const id = data.id;
  isLoading = true;
  note = cloudNotes.notes.find((n) => String(n.id) === String(id));
  if (note === undefined) {
    toast.error(`Note with id ${id} not found`);
    return goto(resolve('/'));
  }
  try {
    const data = await cloudNotes.fetchContent(id);
    if (data) {
      const dbContent = data as Content;
      const { content: fixedContent, replaced } = fixMathReplacer(dbContent);
      content = fixedContent;
      syncedContent = fixedContent;
      isDirty = false;
      if (replaced) {
        isDirty = true;
        await saveNoteContent();
      }
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading note');
    goto(resolve('/'));
  } finally {
    isLoading = false;
  }
}

function onUpdate() {
  isDirty = true;
}

async function updateNote(name: string, icon: string, pinned: boolean) {
  if (note === undefined) return;
  syncing = true;
  try {
    await cloudNotes.update(note.id, { name, icon, pinned });
    note.name = name;
    note.icon = icon;
    note.pinned = pinned;
  } catch (e) {
    toast.error('Could not update note');
    console.error(e);
  } finally {
    syncing = false;
  }
}

beforeNavigate(async () => {
  if (isDirty) {
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
  <div class="flex size-full flex-col">
    <Topbar showSeparator={true}>
      {#snippet left()}
        <Skeleton class="size-8 rounded-md mr-2 bg-muted" />
        <Skeleton class="h-8 w-48 rounded-md bg-muted" />
      {/snippet}
      {#snippet right()}
        <Skeleton class="h-8 w-16 rounded-md bg-muted" />
        <Skeleton class="size-8 rounded-md bg-muted" />
        <Skeleton class="size-8 rounded-md bg-muted" />
        <Skeleton class="size-8 rounded-md bg-muted" />
      {/snippet}
    </Topbar>
    <div class="flex-1 grow overflow-auto p-8">
      <div class="mx-auto w-full max-w-3xl space-y-4">
        <Skeleton class="h-8 w-3/4 rounded-md bg-muted" />
        <Skeleton class="h-8 w-full rounded-md bg-muted" />
        <Skeleton class="h-8 w-full rounded-md bg-muted" />
        <Skeleton class="h-8 w-5/6 rounded-md bg-muted" />
        <Skeleton class="h-64 w-full rounded-lg bg-muted" />
      </div>
    </div>
  </div>
{:else if !isLoading && note !== undefined}
  <div class="flex size-full flex-col">
    <Topbar showSeparator={true}>
      {#snippet left()}
        <IconPicker
          onSelect={(icon: string) => {
            note!.icon = icon;
          }}
          onClose={() => {
            updateNote(note!.name, note!.icon, note!.pinned);
          }}
        >
          <div class={buttonVariants({ variant: "ghost", size: "icon", class: "mr-2" })}>
            <IconRenderer icon={note!.icon} />
          </div>
        </IconPicker>
        <input
          value={note!.name}
          class="hover:bg-muted truncate rounded px-1 py-0.5 text-lg font-bold focus:outline-none"
          onchange={async (e) => {
            const target = e.target as HTMLInputElement;
            const value = target.value;
            if (value.trim() === "") return;
            e.preventDefault();
            await updateNote(value, note!.icon, note!.pinned);
          }}
        />
      {/snippet}

      {#snippet right()}
        {#if note!.is_public}
          <SimpleToolTip>
            <Button variant="ghost" size="icon-sm">
              <icons.Globe class="size-4" />
            </Button>
            {#snippet child()}
              <div class="flex flex-col items-center">
                <span class="font-semibold text-xs"> This is a public note </span>
                <span class="text-[10px] text-muted-foreground">Anyone with the link can view this note</span>
              </div>
            {/snippet}
          </SimpleToolTip>
        {/if}
        {#if editor && !editor?.isDestroyed}
          <div class="text-muted-foreground hidden sm:block truncate text-xs">
            {editor.storage.characterCount.words()} Words
          </div>
          <SearchAndReplace {editor} />
        {/if}
        <SimpleToolTip content={syncing ? syncingText : "Synced"}>
          <Button variant="ghost" size="icon">
            {#if syncing}
              <BarSpinner />
            {:else}
              <icons.Cloud class="size-4" />
            {/if}
          </Button>
        </SimpleToolTip>
        <NavActions
          starred={note!.pinned as boolean}
          toggleStar={() => updateNote(note!.name, note!.icon, !note!.pinned)}
          {editor}
          note={note!}
          bind:useToolBar
          bind:useBubbleMenu
          bind:useDragHandle
        />
      {/snippet}
    </Topbar>
    {#if useToolBar && editor}
      <EdraToolBar {editor} />
    {/if}
    {#if editor && !editor?.isDestroyed}
      {#if useBubbleMenu}
        <EdraBubbleMenu {editor} />
      {/if}
      {#if useDragHandle}
        <EdraDragHandleExtended {editor} />
      {/if}
      <AI {editor} />
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
  </div>
{:else}
  <div class="flex size-full flex-col items-center justify-center gap-4">
    <h4>Something went wrong loading this note.</h4>
    <a href={resolve("/")}>Go to Home</a>
  </div>
{/if}
