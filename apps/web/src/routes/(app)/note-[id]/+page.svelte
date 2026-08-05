<script lang="ts">
import { ALLOWED_MAX_FILE_SIZE, FileType, getFileTypeExtensions } from '@lib/components/edra/utils.js';
import { Skeleton } from '@lib/components/ui/skeleton/index.js';
import {
  callAI,
  getAuthContext,
  getNotesContext,
  getStorageContext,
  getWorkspacesContext,
  type Note,
  type SelectableModel,
} from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { type Content, createEditor, Edra } from '@nota/ui/edra/index.js';
import { BarSpinner, IconPicker, IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { toast } from '@nota/ui/shadcn/sonner';
import { compare } from 'fast-json-patch';
import { onDestroy, onMount } from 'svelte';
import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getGlobalSettings } from '$lib/components/settings/index.svelte';
import NavActions from '$lib/components/sidebar/nav-actions.svelte';
import Topbar from '$lib/components/topbar.svelte';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import 'katex/dist/katex.min.css';

// --- Services & Context ---
const cloudWorkspaces = getWorkspacesContext();
const cloudNotes = getNotesContext();
const cloudStorage = getStorageContext();
const useGlobalSettings = getGlobalSettings();
const currentWorkspaceCtx = getCurrentWorkspace();
const currentWorkspace = $derived(currentWorkspaceCtx.get());
const authContext = getAuthContext();

// --- State ---
const { data } = $props();
let syncedContent = $state<Content>();
let isDirty = $state(false);

// Note data derived from store
let note = $state<Note>();

let isLoading = $state(true);
let syncing = $state(false);
let syncingText = $state('');
let availableModels = $state<Record<string, SelectableModel[]>>({});

// --- File Handling Utilities ---
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
  return new Promise<string | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';

    if (fileType === FileType.IMAGE) input.accept = 'image/*';
    else if (fileType === FileType.VIDEO) input.accept = 'video/*';
    else if (fileType === FileType.AUDIO) input.accept = 'audio/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return resolve(null);

      if (file.size > ALLOWED_MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large (max 50MB).`);
        return resolve(null);
      }

      const user = authContext.user;
      if (user && user.used_storage + file.size > user.assigned_storage) {
        toast.error(`Not enough storage to upload ${file.name}.`);
        return resolve(null);
      }

      try {
        const uploadPromise = cloudStorage.upload(file, {
          workspaceId: currentWorkspace?.id,
          noteId: note?.id,
        });
        toast.promise(uploadPromise, {
          loading: `Uploading ${file.name}...`,
          success: `${file.name} uploaded successfully`,
          error: `Failed to upload ${file.name}`,
        });
        const url = await uploadPromise;
        resolve(url);
      } catch (err) {
        console.error(err);
        resolve(null);
      }
    };
    input.click();
  });
};

// --- Editor Setup ---
const editor = createEditor({
  onUpdate: () => {
    isDirty = true;
  },
  onFileUpload: (file) => {
    const user = authContext.user;
    if (user && user.used_storage + file.size > user.assigned_storage) {
      toast.error(`Not enough storage to upload ${file.name}.`);
      return Promise.reject(new Error('Storage quota exceeded'));
    }
    return cloudStorage.upload(file, {
      workspaceId: currentWorkspace?.id,
      noteId: note?.id,
    });
  },
  selectFile: getLocalFile,
  getAssets,
  callAI: (prompt: string, onChunk: (chunk: string) => void, onError?: (error: Error) => void) => {
    return callAI(prompt, note?.id || '', onChunk, onError);
  },
});

// --- Hooks ---
afterNavigate(() => {
  if (data.id) loadData();
});

$effect(() => {
  if (note?.workspace_id && cloudWorkspaces.workspaces.length > 0) {
    const workspace = cloudWorkspaces.workspaces.find((w) => w.id === note?.workspace_id);
    if (workspace && currentWorkspaceCtx.get()?.id !== workspace.id) {
      currentWorkspaceCtx.set(workspace);
    }
  }
});

onMount(() => {
  // auto save is called in every 2 mins
  const saveInterval = setInterval(() => {
    saveNoteContent();
  }, 120000);
  return () => clearInterval(saveInterval);
});

beforeNavigate(async () => {
  if (isDirty) {
    await saveNoteContent();
  }
});

onDestroy(() => {
  editor?.destroy();
});

// --- Data Operations ---
async function saveNoteContent() {
  if (!isDirty || !note || !editor) return;

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

async function loadData() {
  const id = data.id;
  isLoading = true;
  note = cloudNotes.notes.find((n) => n.id === id);
  if (!note) {
    try {
      note = await cloudNotes.fetchMeta(id);
    } catch (error) {
      console.error(error);
    }
  }
  if (!note) {
    toast.error(`Note with id ${id} not found`);
    return goto(resolve('/(app)/home'));
  }
  try {
    const data = await cloudNotes.fetchContent(id);
    if (data) {
      const dbContent = data as Content;
      editor?.commands.setContent(dbContent, { contentType: 'json' });
      syncedContent = dbContent;
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when loading note');
    goto(resolve('/(app)/home'));
  } finally {
    isLoading = false;
  }
}

async function updateNote(name: string, icon: string, pinned: boolean) {
  if (!note) return;
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

async function handleNameChange(e: Event) {
  if (!note) return;
  const target = e.target as HTMLInputElement;
  const value = target.value.trim();
  if (!value) return;
  await updateNote(value, note.icon, note.pinned);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    saveNoteContent();
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
        <IconPicker
          onSelect={(icon: string) => {
            if (note) note.icon = icon;
          }}
          onClose={() => {
            if (note) updateNote(note.name, note.icon, note.pinned);
          }}
        >
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
        {#if note?.is_public}
          <SimpleToolTip>
            <Button variant="ghost" size="icon">
              <icons.Globe />
            </Button>
            {#snippet child()}
              <div class="flex flex-col items-center">
                <p class="font-semibold">This is a public note</p>
                <span>Anyone with the link can view this note</span>
              </div>
            {/snippet}
          </SimpleToolTip>
        {/if}
        <SimpleToolTip content={syncing ? syncingText : "Synced"}>
          <Button variant="ghost" size="icon">
            {#if syncing}
              <BarSpinner />
            {:else}
              <icons.Cloud />
            {/if}
          </Button>
        </SimpleToolTip>
        <NavActions
          starred={Boolean(note?.pinned)}
          toggleStar={() => {
            if (note) updateNote(note.name, note.icon, !note.pinned);
          }}
          {editor}
          note={note!}
        />
      {/snippet}
    </Topbar>
    <Edra {editor}>
      <Edra.ToC />
      {#if useGlobalSettings.useToolBar}
        <Edra.Toolbar />
      {/if}
      {#if useGlobalSettings.useBubbleMenu}
        <Edra.BubbleMenu />
      {/if}
      {#if useGlobalSettings.useAI}
        <Edra.UseAI {availableModels} />
      {/if}
      <Edra.Content
        class="min-w-full overflow-auto w-full cursor-auto px-8 py-4 text-base transition-all duration-300 *:outline-none"
      />
      {#if useGlobalSettings.useDragHandle}
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
      href={resolve("/(app)/home")}
      variant="outline"
      class="mt-4 rounded-full px-6"
    >
      Go to Home
    </Button>
  </div>
{/if}
