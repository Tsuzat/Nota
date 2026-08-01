<script lang="ts">
import { IconRenderer, icons } from '@lib/icons';
import { getAuthContext, getStorageContext, getWorkspacesContext } from '@nota/client';
import StorageViewer, { type StorageAssetItem } from '@nota/ui/custom/StorageViewer.svelte';
import { Button } from '@nota/ui/shadcn/button';
import * as Dialog from '@nota/ui/shadcn/dialog';
import * as Select from '@nota/ui/shadcn/select';
import { toast } from '@nota/ui/shadcn/sonner';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, resolve } from '@tauri-apps/api/path';
import { BaseDirectory, readDir, remove, stat } from '@tauri-apps/plugin-fs';
import { openPath, openUrl } from '@tauri-apps/plugin-opener';
import { onMount } from 'svelte';
import Topbar from '$lib/components/topbar.svelte';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';

const authContext = getAuthContext();
const cloudStorage = getStorageContext();
const cloudWorkspaces = getWorkspacesContext();
const localWorkspaces = getLocalWorkspaces();
const currentWorkspaceContext = getCurrentWorkspace();

// Selection state formatted as `type:id` (e.g. `local:123`, `cloud:456`, `cloud:all`)
let selectedValue = $state<string>('');

let isLoading = $state<boolean>(false);
let searchQuery = $state<string>('');
let mediaTypeFilter = $state<string>('all');
let sortByFilter = $state<string>('created_at');
let sortOrderFilter = $state<string>('desc');
let page = $state<number>(1);
let limit = $state<number>(20);

// Local files state
let localAssets = $state<StorageAssetItem[]>([]);
let localUsedBytes = $state<number>(0);

// Delete confirmation state
let fileToDelete = $state<StorageAssetItem | null>(null);
let isDeleteDialogOpen = $state<boolean>(false);
let isDeleting = $state<boolean>(false);

// Derived selected info
const selectedType = $derived(selectedValue.split(':')[0] || 'cloud');
const selectedId = $derived(selectedValue.split(':')[1] || '');

// Setup initial selected value
onMount(() => {
  const cur = currentWorkspaceContext.get();
  if (cur) {
    if ('owner' in cur) {
      selectedValue = `cloud:${cur.id}`;
    } else {
      selectedValue = `local:${cur.id}`;
    }
  } else {
    selectedValue = 'cloud:all';
  }
});

// Display label for selected option
const selectedLabel = $derived.by(() => {
  if (selectedValue === 'cloud:all') return 'All Cloud Storage';
  if (selectedType === 'local') {
    const w = localWorkspaces.getWorkspaces().find((item) => item.id === selectedId);
    return w ? `Local: ${w.name}` : 'Local Workspace';
  }
  if (selectedType === 'cloud') {
    const w = cloudWorkspaces.workspaces.find((item) => item.id === selectedId);
    return w ? `Cloud: ${w.name}` : 'Cloud Workspace';
  }
  return 'Select Workspace';
});

// Fetch data on workspace or options change
async function loadStorageData() {
  if (!selectedValue) return;
  isLoading = true;

  try {
    if (selectedType === 'local') {
      const appDir = await appDataDir();
      const entries = await readDir('assets', {
        baseDir: BaseDirectory.AppData,
      }).catch((err) => {
        console.error('readDir error:', err);
        return [];
      });

      let items: StorageAssetItem[] = [];
      let totalSize = 0;

      for (const entry of entries) {
        if (!entry.isFile) continue;

        const relativePath = `assets/${entry.name}`;
        const filePath = await resolve(appDir, relativePath);
        const fileStat = await stat(relativePath, {
          baseDir: BaseDirectory.AppData,
        }).catch((err) => {
          console.error('stat error for', relativePath, err);
          return null;
        });

        const size = fileStat?.size || 0;
        totalSize += size;

        const ext = entry.name.split('.').pop()?.toLowerCase() || '';
        let mime_type = 'application/octet-stream';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
          mime_type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        } else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
          mime_type = `video/${ext}`;
        } else if (['mp3', 'wav', 'm4a', 'aac', 'flac'].includes(ext)) {
          mime_type = `audio/${ext}`;
        } else if (ext === 'pdf') {
          mime_type = 'application/pdf';
        } else if (['txt', 'md', 'json', 'doc', 'docx'].includes(ext)) {
          mime_type = `text/${ext}`;
        }

        // Search filter
        if (searchQuery && !entry.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          continue;
        }

        // Media type filter
        if (mediaTypeFilter !== 'all') {
          if (mediaTypeFilter === 'image' && !mime_type.startsWith('image/')) continue;
          if (mediaTypeFilter === 'video' && !mime_type.startsWith('video/')) continue;
          if (mediaTypeFilter === 'audio' && !mime_type.startsWith('audio/')) continue;
          if (mediaTypeFilter === 'document' && !mime_type.includes('pdf') && !mime_type.startsWith('text/')) continue;
          if (
            mediaTypeFilter === 'other' &&
            (mime_type.startsWith('image/') ||
              mime_type.startsWith('video/') ||
              mime_type.startsWith('audio/') ||
              mime_type.includes('pdf') ||
              mime_type.startsWith('text/'))
          )
            continue;
        }

        items.push({
          id: entry.name,
          name: entry.name,
          path: convertFileSrc(filePath),
          mime_type,
          size,
          created_at: fileStat?.mtime ? new Date(fileStat.mtime) : new Date(),
          updated_at: fileStat?.mtime ? new Date(fileStat.mtime) : new Date(),
        });
      }

      // Sorting
      items.sort((a, b) => {
        let cmp = 0;
        if (sortByFilter === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortByFilter === 'size') {
          cmp = a.size - b.size;
        } else {
          // created_at / date
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          cmp = dateA - dateB;
        }
        return sortOrderFilter === 'asc' ? cmp : -cmp;
      });

      localAssets = items;
      localUsedBytes = totalSize;
    } else {
      await cloudStorage.fetch({
        workspaceId: selectedId === 'all' ? undefined : selectedId,
        page,
        limit,
        search: searchQuery,
        type: mediaTypeFilter === 'all' ? undefined : mediaTypeFilter,
        sortBy: sortByFilter,
        sortOrder: sortOrderFilter,
      });
    }
  } catch (err) {
    console.error('Error loading storage assets:', err);
    toast.error('Failed to load storage assets');
  } finally {
    isLoading = false;
  }
}

$effect(() => {
  // Re-run whenever workspace selection or filter options change
  if (selectedValue) {
    loadStorageData();
  }
});

function handleRefresh() {
  loadStorageData();
}

async function handleOpenFile(asset: StorageAssetItem) {
  try {
    if (selectedType === 'local') {
      const appDir = await appDataDir();
      const relativePath = `assets/${asset.id}`;
      const filePath = await resolve(appDir, relativePath);
      await openPath(filePath);
    } else {
      await openUrl(asset.path);
    }
  } catch (err) {
    console.error('Failed to open file:', err);
    toast.error('Failed to open file');
  }
}

function handleDeleteClick(id: string) {
  if (selectedType === 'local') {
    const asset = localAssets.find((a) => a.id === id);
    if (asset) {
      fileToDelete = asset;
      isDeleteDialogOpen = true;
    }
  } else {
    const asset = cloudStorage.assets.find((a) => a.id === id);
    const size = asset?.size || 0;
    cloudStorage
      .delete(id)
      .then(() => {
        if (authContext.user) {
          authContext.user.used_storage = Math.max(0, authContext.user.used_storage - size);
        }
      })
      .catch((err) => {
        console.error('Failed to delete cloud asset:', err);
        toast.error('Failed to delete asset');
      });
  }
}

async function confirmLocalDelete() {
  if (!fileToDelete) return;
  isDeleting = true;
  try {
    await remove(`assets/${fileToDelete.name}`, {
      baseDir: BaseDirectory.AppData,
    });
    toast.success(`Deleted ${fileToDelete.name}`);
    isDeleteDialogOpen = false;
    fileToDelete = null;
    await loadStorageData();
  } catch (err) {
    console.error('Failed to delete local asset:', err);
    toast.error('Failed to delete file from disk');
  } finally {
    isDeleting = false;
  }
}

// Active props for StorageViewer
const currentAssets = $derived(selectedType === 'local' ? localAssets : cloudStorage.assets);
const currentTotal = $derived(selectedType === 'local' ? localAssets.length : cloudStorage.total);
const currentUsedStorage = $derived(selectedType === 'local' ? localUsedBytes : (cloudStorage.usedBytes ?? 0));
const currentAssignedStorage = $derived(
  selectedType === 'local' ? localUsedBytes : (authContext.user?.assigned_storage ?? 0)
);
</script>

<div class="flex size-full min-h-0 overflow-hidden flex-col">
  <Topbar>
    {#snippet left()}
      <h1 class="text-lg font-semibold tracking-tight ml-2">Storage</h1>
    {/snippet}

    {#snippet right()}
      <!-- Workspace Selector -->
      <Select.Root type="single" bind:value={selectedValue}>
        <Select.Trigger
          class="h-8 w-60 text-xs flex items-center justify-between"
        >
          <span class="truncate">{selectedLabel}</span>
        </Select.Trigger>
        <Select.Content>
          <!-- All Cloud Storage -->
          <Select.Group>
            <Select.GroupHeading>Cloud Overview</Select.GroupHeading>
            <Select.Item value="cloud:all" label="All Cloud Storage">
              <div class="flex items-center gap-2">
                <icons.Cloud class="size-4 shrink-0 text-primary" />
                <span>All Cloud Storage</span>
              </div>
            </Select.Item>
          </Select.Group>

          <!-- Cloud Workspaces -->
          {#if cloudWorkspaces.workspaces.length > 0}
            <Select.Group>
              <Select.GroupHeading>Cloud Workspaces</Select.GroupHeading>
              {#each cloudWorkspaces.workspaces as ws (ws.id)}
                <Select.Item value={`cloud:${ws.id}`} label={ws.name}>
                  <div class="flex items-center gap-2">
                    <IconRenderer icon={ws.icon} class="size-4 shrink-0" />
                    <span>{ws.name}</span>
                  </div>
                </Select.Item>
              {/each}
            </Select.Group>
          {/if}

          <!-- Local Workspaces -->
          {#if localWorkspaces.getWorkspaces().length > 0}
            <Select.Group>
              <Select.GroupHeading>Local Workspaces</Select.GroupHeading>
              {#each localWorkspaces.getWorkspaces() as ws (ws.id)}
                <Select.Item value={`local:${ws.id}`} label={ws.name}>
                  <div class="flex items-center gap-2">
                    <IconRenderer icon={ws.icon} class="size-4 shrink-0" />
                    <span>{ws.name}</span>
                  </div>
                </Select.Item>
              {/each}
            </Select.Group>
          {/if}
        </Select.Content>
      </Select.Root>
    {/snippet}
  </Topbar>

  <!-- Storage View Body -->
  <main class="flex-1 max-h-[calc(100vh-3rem)] overflow-auto!">
    <div class="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <StorageViewer
        title={selectedLabel}
        usedStorage={currentUsedStorage}
        assignedStorage={currentAssignedStorage}
        isLocal={selectedType === "local"}
        assets={currentAssets}
        total={currentTotal}
        bind:page
        {limit}
        bind:search={searchQuery}
        bind:mediaType={mediaTypeFilter}
        bind:sortBy={sortByFilter}
        bind:sortOrder={sortOrderFilter}
        {isLoading}
        onRefresh={handleRefresh}
        onDelete={handleDeleteClick}
        onOpen={handleOpenFile}
      />
    </div>
  </main>
</div>

<!-- Local Delete Confirmation Dialog -->
<Dialog.Root bind:open={isDeleteDialogOpen}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title class="text-red-500 flex items-center gap-2">
        <icons.TriangleAlert class="size-5" />
        Delete Local Asset
      </Dialog.Title>
      <Dialog.Description class="pt-2 text-sm text-muted-foreground">
        Are you sure you want to delete <strong>{fileToDelete?.name}</strong>?
        <br /><br />
        <span class="text-amber-500 font-medium">
          Warning: Make sure this file is not referenced in any of your notes.
          Otherwise, notes will fail to display it.
        </span>
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex justify-end gap-2 mt-4">
      <Button
        variant="outline"
        onclick={() => (isDeleteDialogOpen = false)}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onclick={confirmLocalDelete}
        disabled={isDeleting}
      >
        {#if isDeleting}
          Deleting...
        {:else}
          Delete File
        {/if}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
