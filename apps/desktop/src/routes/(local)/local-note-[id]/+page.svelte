<script lang="ts">
import { callAI, getAllConfiguredModels, type SelectableModel } from '@nota/client';
import { type Content, createEditor, Edra } from '@nota/ui/edra/index.js';
import { IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { Skeleton } from '@nota/ui/shadcn/skeleton';
import { toast } from '@nota/ui/shadcn/sonner';
import { onDestroy, onMount } from 'svelte';
import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getGlobalSettings } from '$lib/components/settings/constants.svelte.js';
import NavActions from '$lib/components/sidebar/nav-actions.svelte';
import Topbar from '$lib/components/topbar.svelte';
import { DB } from '$lib/local/db.js';
import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { createFile, getAssetsByFileType, selectLocalFile } from '$lib/local/util.js';
import { getLocalVersions } from '$lib/local/versions.svelte';

// --- Services & Context ---
const globalSettings = getGlobalSettings();
const localNotes = getLocalNotes();
const localVersions = getLocalVersions();

// --- State ---
const { data } = $props();
let note = $state<LocalNote>();
let isLoading = $state(true);
let isDirty = $state(false);
let availableModels = $state<Record<string, SelectableModel[]>>({});

// --- Editor Setup ---
const editor = createEditor({
  onUpdate: () => {
    isDirty = true;
  },
  onFileUpload: createFile,
  selectFile: selectLocalFile,
  getAssets: getAssetsByFileType,
  callAI: (prompt: string, onChunk: (chunk: string) => void, onError?: (error: Error) => void) => {
    return callAI(prompt, note?.id || '', onChunk, onError);
  },
});

afterNavigate(() => {
  if (data.id) loadData();
  getAllConfiguredModels().then((m) => {
    availableModels = m;
  });
});

onMount(() => {
  const saveInterval = setInterval(() => {
    if (isDirty) saveContent();
  }, 5000);
  return () => clearInterval(saveInterval);
});

beforeNavigate(() => {
  if (isDirty) saveContent();
});

onDestroy(() => {
  editor?.destroy();
});

// --- Data Operations ---
async function loadData() {
  isLoading = true;
  const id = data.id;
  note = localNotes.getNotes().find((n) => n.id === id);
  if (!note) {
    try {
      const rows = await DB.select<LocalNote[]>(
        'SELECT id, workspace_id, parent_note_id, name, icon, pinned, deleted_at, created_at, updated_at FROM notes WHERE id = $1',
        [id]
      );
      if (rows.length > 0) {
        const r = rows[0];
        note = {
          ...r,
          pinned: r.pinned === 'true' || (r.pinned as any) === 1 || r.pinned === true,
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!note) {
    toast.error(`Note with id ${id} not found`);
    return goto(resolve('/'));
  }
  try {
    const rows = await DB.select<{ content: string }[]>('SELECT content FROM notes WHERE id = $1', [id]);
    if (rows.length === 0) {
      toast.error(`Note content with id ${id} not found`);
      return goto(resolve('/'));
    }
    const parsedContent = JSON.parse(rows[0].content) as Content;
    editor?.commands.setContent(parsedContent, { contentType: 'json' });
    isDirty = false;
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading note');
  } finally {
    isLoading = false;
  }
}

async function saveContent() {
  if (!note || !editor || !isDirty) return;
  try {
    const contentJSON = editor.getJSON();
    await DB.execute('UPDATE notes SET content = $1 WHERE id = $2', [JSON.stringify(contentJSON), note.id]);
    isDirty = false;

    // Attempt auto-snapshot
    if (note.workspace_id) {
      await localVersions.maybeAutoSnapshot(note.id, note.workspace_id, contentJSON, 'local');
    }
  } catch (err) {
    console.error('Failed to save note content:', err);
  }
}

// --- Action Handlers ---
async function updateIcon(icon: string) {
  if (!note) return;
  try {
    note.icon = icon;
    await localNotes.updateNote(note);
  } catch (e) {
    toast.error('Could not update note icon');
    console.error(e);
  }
}

async function handleNameChange(e: Event) {
  if (!note) return;
  const target = e.target as HTMLInputElement;
  const value = target.value.trim();
  if (!value) return;
  try {
    note = { ...note, name: value };
    await localNotes.updateNote(note);
  } catch (e) {
    toast.error('Could not update note name');
    console.error(e);
  }
}

async function toggleStar() {
  if (!note) return;
  try {
    note = { ...note, pinned: !note.pinned };
    await localNotes.updateNote(note);
  } catch (e) {
    toast.error('Could not update note starred state');
    console.error(e);
  }
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    toast.promise(saveContent(), {
      loading: 'Saving to local store',
      success: 'Note saved',
      error: 'Could not save note',
      duration: 1000,
    });
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if isLoading}
  <div class="flex size-full min-h-0 flex-col overflow-hidden">
    <Topbar showSeparator={true}>
      {#snippet left()}
        <Skeleton class="mr-2 size-8 rounded-md" />
        <Skeleton class="h-8 w-48 rounded-md" />
      {/snippet}
      {#snippet right()}
        <Skeleton class="h-8 w-16 rounded-md" />
        <Skeleton class="size-8 rounded-md" />
        <Skeleton class="size-8 rounded-md" />
        <Skeleton class="size-8 rounded-md" />
      {/snippet}
    </Topbar>
    <div class="min-h-0 flex-1 grow overflow-auto p-8">
      <div class="mx-auto w-full max-w-3xl space-y-4">
        <Skeleton class="h-8 w-3/4 rounded-md" />
        <Skeleton class="h-8 w-full rounded-md" />
        <Skeleton class="h-8 w-full rounded-md" />
        <Skeleton class="h-8 w-5/6 rounded-md" />
        <Skeleton class="h-64 w-full rounded-lg" />
      </div>
    </div>
  </div>
{:else if note && editor}
  <div
    class="relative flex max-h-screen! min-h-screen! w-full! flex-col overflow-hidden!"
  >
    <Topbar showSeparator={true}>
      {#snippet left()}
        <IconPicker onSelect={updateIcon}>
          <div
            class={buttonVariants({
              variant: "ghost",
              size: "icon",
              class: "mr-2",
            })}
          >
            <IconRenderer icon={note!.icon} />
          </div>
        </IconPicker>
        <input
          value={note?.name}
          class="hover:bg-muted truncate rounded px-1 py-0.5 text-lg font-bold focus:outline-none"
          onchange={handleNameChange}
        />
      {/snippet}

      {#snippet right()}
        <NavActions
          starred={Boolean(note?.pinned)}
          {toggleStar}
          note={note!}
          {editor}
        />
      {/snippet}
    </Topbar>
    <Edra {editor}>
      <Edra.ToC />
      {#if globalSettings.useToolBar}
        <Edra.Toolbar />
      {/if}
      {#if globalSettings.useBubbleMenu}
        <Edra.BubbleMenu />
      {/if}
      {#if globalSettings.useAI}
        <Edra.UseAI {availableModels} />
      {/if}
      <Edra.Content
        class="min-w-full overflow-auto w-full cursor-auto px-8 py-4 text-base transition-all duration-300 *:outline-none"
      />
      {#if globalSettings.useDragHandle}
        <Edra.DragHandle
          type="extended"
          class="transition-all! duration-300!"
        />
      {/if}
    </Edra>
  </div>
{:else}
  <div
    class="flex flex-1 grow size-full min-h-0 flex-col items-center justify-center gap-4 p-8 animate-in fade-in"
  >
    <div
      class="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2"
    >
      <icons.TriangleAlert class="size-8" />
    </div>
    <h4 class="text-xl font-semibold text-center">
      Something went wrong loading this note.
    </h4>
    <p class="text-muted-foreground text-sm max-w-md text-center">
      It may have been deleted or you don't have access.
    </p>
    <Button
      href={resolve("/")}
      variant="outline"
      class="mt-4 rounded-full px-6"
    >
      Go to Home
    </Button>
  </div>
{/if}
