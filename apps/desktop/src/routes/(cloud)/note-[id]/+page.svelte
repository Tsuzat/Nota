<script lang="ts">
import type { FileType } from '@lib/components/edra/utils.js';
import { Skeleton } from '@lib/components/ui/skeleton/index.js';
import { cn } from '@lib/utils.js';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import SearchAndReplace from '@nota/ui/edra/shadcn/components/toolbar/SearchAndReplace.svelte';
import { EdraBubbleMenu, EdraDragHandleExtended, EdraEditor, EdraToolBar } from '@nota/ui/edra/shadcn/index.js';
import type { Content, Editor } from '@nota/ui/edra/types.js';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { Separator } from '@nota/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { compare } from 'fast-json-patch';
import { onMount } from 'svelte';
import { beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import AppLogoMenu from '$lib/components/app-menu.svelte';
import BackAndForthButtons from '$lib/components/back-and-forth-buttons.svelte';
import AI from '$lib/components/editor/AI.svelte';
import { getGlobalSettings } from '$lib/components/settings/index.js';
import NavActions from '$lib/components/sidebar/nav-actions.svelte';
import WindowsButtons from '$lib/components/windows-buttons.svelte';
import { type CloudNote, useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte.js';
import { supabase } from '$lib/supabase/index.js';
import { getAssetsByFileType, uploadFile, uploadFileByPath, uploadLocalFile } from '$lib/supabase/storage.js';
import { getSessionAndUserContext } from '$lib/supabase/user.svelte.js';
import { ISMACOS, ISWINDOWS } from '$lib/utils';

const { data } = $props();

$effect(() => {
  if (data.id) loadData(data.id);
});

const sidebar = useSidebar();

// editor related
let editor = $state<Editor>();
let element = $state<HTMLElement>();
let content = $state<Content>();
let syncedContent = $state<Content>();
let isDirty = $state(false);

// cloud related
const cloudNotes = useCloudNotes();
const user = $derived(getSessionAndUserContext().getUser());
const useGlobalSettings = getGlobalSettings();

// notes related
let isLoading = $state(false);
let note = $state<CloudNote>();
let syncing = $state(false);
let syncingText = $state('');

const onFileSelect = $derived.by(() => {
  if (user) return (file: string) => uploadFileByPath(user.id, file);
});

const onDropOrPaste = $derived.by(() => {
  if (user) return (file: File) => uploadFile(user.id, file);
});

const getAssets = $derived.by(() => {
  if (user) return async (fileType: FileType) => getAssetsByFileType(user.id, fileType);
});

const getLocalFile = $derived.by(() => {
  if (user) return async (fileType: FileType) => uploadLocalFile(user.id, fileType);
});

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
    const { error } = await supabase.rpc('apply_note_patch', {
      note_id: note.id,
      patch: patch,
    });

    if (error) {
      console.error(error);
      toast.error(error.message);
    } else {
      syncedContent = currentContent;
      isDirty = false;
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
    saveNoteContent();
  }, 120000);
  return () => clearInterval(saveInterval);
});

async function loadData(id: string) {
  isLoading = true;
  note = cloudNotes.getNotes().find((n) => n.id === id);
  if (note === undefined) {
    toast.error(`Notes with id ${id} not found`);
    return goto(resolve('/'));
  }
  try {
    const { data, error } = await supabase.from('notes').select('content').eq('id', id).single();
    if (error) {
      console.error(error);
      toast.error(error.message);
      goto(resolve('/'));
    }
    if (data) {
      const dbContent = data.content as Content;
      content = dbContent;
      syncedContent = dbContent;
      isDirty = false;
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading notes');
    goto(resolve('/'));
  } finally {
    isLoading = false;
  }
}

function onUpdate() {
  isDirty = true;
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
    await cloudNotes.toggleFavorite(note);
  } catch (e) {
    toast.error('Could not update note starred');
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
    <header class="flex h-12 shrink-0 items-center gap-2">
      <div
        class={cn(
          "z-20 ml-18 flex items-center gap-2 px-3",
          ISMACOS && !sidebar.open && "ml-18",
          ISWINDOWS && !sidebar.open && "ml-0",
          sidebar.open && "md:ml-0"
        )}
      >
        {#if ISWINDOWS && !sidebar.open}
          <AppLogoMenu />
        {/if}
        <SidebarTrigger />
        <BackAndForthButtons />
        <Separator
          orientation="vertical"
          class="mr-2 data-[orientation=vertical]:h-4"
        />
        <Skeleton class="size-8 rounded-md" />
        <Skeleton class="h-8 w-48 rounded-md" />
      </div>

      <div
        class={cn(
          "z-20 ml-auto flex items-center gap-2 px-3",
          ISWINDOWS && "mr-30"
        )}
      >
        <Skeleton class="h-8 w-16 rounded-md" />
        <Skeleton class="size-8 rounded-md" />
        <Skeleton class="size-8 rounded-md" />
        <Skeleton class="size-8 rounded-md" />
      </div>
      {#if ISWINDOWS}
        <WindowsButtons />
      {/if}
    </header>
    <div class="flex-1 grow overflow-auto p-8">
      <div class="mx-auto w-full max-w-3xl space-y-4">
        <Skeleton class="h-8 w-3/4 rounded-md" />
        <Skeleton class="h-8 w-full rounded-md" />
        <Skeleton class="h-8 w-full rounded-md" />
        <Skeleton class="h-8 w-5/6 rounded-md" />
        <Skeleton class="h-64 w-full rounded-lg" />
      </div>
    </div>
  </div>
{:else if !isLoading && note !== undefined}
  <header class="flex h-12 shrink-0 items-center gap-2">
    <div
      class={cn(
        "z-20 ml-18 flex items-center gap-2 px-3",
        ISMACOS && !sidebar.open && "ml-18",
        ISWINDOWS && !sidebar.open && "ml-0",
        sidebar.open && "md:ml-0"
      )}
    >
      {#if ISWINDOWS && !sidebar.open}
        <AppLogoMenu />
      {/if}
      <SidebarTrigger />
      <BackAndForthButtons />
      <Separator
        orientation="vertical"
        class="mr-2 data-[orientation=vertical]:h-4"
      />
      <IconPicker onSelect={updateIcon}>
        <div class={buttonVariants({ variant: "ghost", class: "size-7! p-1" })}>
          <IconRenderer icon={note.icon} />
        </div>
      </IconPicker>
      <input
        value={note.name}
        class="hover:bg-muted truncate rounded px-1 py-0.5 text-lg font-bold focus:outline-none"
        onchange={(e) => {
          const target = e.target as HTMLInputElement;
          const value = target.value;
          if (value.trim() === "") return;
          updateName(target.value);
        }}
      />
    </div>

    <div
      class={cn(
        "z-20 ml-auto flex items-center gap-2 px-3",
        ISWINDOWS && "mr-30"
      )}
    >
      {#if note.isPublic}
        <SimpleToolTip>
          <Button variant="ghost" size="icon-sm">
            <icons.Globe />
          </Button>
          {#snippet child()}
            <div class="flex flex-col items-center">
              <span class="font-semibold"> This is a public note </span>
              <span>Anyone with the link can view this note</span>
            </div>
          {/snippet}
        </SimpleToolTip>
      {/if}
      {#if editor && !editor?.isDestroyed}
        <div class="text-muted-foreground truncate text-xs">
          {editor.storage.characterCount.words()} Words
        </div>
        <SearchAndReplace {editor} />
      {/if}
      <SimpleToolTip content={syncing ? syncingText : "Synced"}>
        <Button variant="ghost" size="icon-sm">
          {#if syncing}
            <icons.Loader class="text-primary animate-spin" />
          {:else}
            <icons.Cloud />
          {/if}
        </Button>
      </SimpleToolTip>
      <NavActions
        starred={note.favorite as boolean}
        {toggleStar}
        {editor}
        {note}
      />
    </div>
    {#if ISWINDOWS}
      <WindowsButtons />
    {/if}
  </header>
  {#if useGlobalSettings.useToolBar && editor}
    <EdraToolBar {editor} />
  {/if}
  {#if editor && !editor?.isDestroyed}
    {#if useGlobalSettings.useBubbleMenu}
      <EdraBubbleMenu {editor} />
    {/if}
    {#if useGlobalSettings.useDragHandle}
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
    <a href={resolve("/")}>Got to Home</a>
  </div>
{/if}
