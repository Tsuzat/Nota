<script lang="ts">
import { getAuthContext, getStorageContext, getWorkspacesContext } from '@nota/client';
import StorageViewer, { type StorageAssetItem } from '@nota/ui/custom/StorageViewer.svelte';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as Select from '@nota/ui/shadcn/select';
import { toast } from '@nota/ui/shadcn/sonner';
import { onMount } from 'svelte';
import Topbar from '$lib/components/topbar.svelte';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';

const authContext = getAuthContext();
const cloudStorage = getStorageContext();
const cloudWorkspaces = getWorkspacesContext();
const currentWorkspaceCtx = getCurrentWorkspace();
const currentWorkspace = $derived(currentWorkspaceCtx.get());

// Selection state formatted as `cloud:id` (e.g. `cloud:123`, `cloud:all`)
let selectedValue = $state<string>('cloud:all');

let isLoading = $state<boolean>(false);
let searchQuery = $state<string>('');
let mediaTypeFilter = $state<string>('all');
let sortByFilter = $state<string>('created_at');
let sortOrderFilter = $state<string>('desc');
let page = $state<number>(1);
let limit = $state<number>(20);

const selectedType = $derived(selectedValue.split(':')[0] || 'cloud');
const selectedId = $derived(selectedValue.split(':')[1] || '');

// Setup initial selected value
onMount(() => {
  if (currentWorkspace) {
    selectedValue = `cloud:${currentWorkspace.id}`;
  } else {
    selectedValue = 'cloud:all';
  }
});

// Display label for selected option
const selectedLabel = $derived.by(() => {
  if (selectedValue === 'cloud:all') return 'All Cloud Storage';
  const w = cloudWorkspaces.workspaces.find((item) => item.id === selectedId);
  return w ? `Cloud: ${w.name}` : 'Cloud Workspace';
});

// Fetch storage data
async function loadStorageData() {
  if (!selectedValue) return;
  isLoading = true;

  try {
    await cloudStorage.fetch({
      workspaceId: selectedId === 'all' ? undefined : selectedId,
      page,
      limit,
      search: searchQuery,
      type: mediaTypeFilter === 'all' ? undefined : mediaTypeFilter,
      sortBy: sortByFilter,
      sortOrder: sortOrderFilter,
    });
  } catch (err) {
    console.error('Error loading storage assets:', err);
    toast.error('Failed to load storage assets');
  } finally {
    isLoading = false;
  }
}

$effect(() => {
  if (selectedValue) {
    loadStorageData();
  }
});

function handleRefresh() {
  loadStorageData();
}

function handleOpenFile(asset: StorageAssetItem) {
  try {
    window.open(asset.path, '_blank');
  } catch (err) {
    console.error('Failed to open file:', err);
    toast.error('Failed to open file');
  }
}

function handleDeleteClick(id: string) {
  const asset = cloudStorage.assets.find((a) => a.id === id);
  const size = asset?.size || 0;
  cloudStorage
    .delete(id)
    .then(() => {
      if (authContext.user) {
        authContext.user.used_storage = Math.max(0, authContext.user.used_storage - size);
      }
      toast.success('Asset deleted successfully');
    })
    .catch((err) => {
      console.error('Failed to delete cloud asset:', err);
      toast.error('Failed to delete asset');
    });
}

const currentAssets = $derived(cloudStorage.assets);
const currentTotal = $derived(cloudStorage.total);
const currentUsedStorage = $derived(cloudStorage.usedBytes ?? 0);
const currentAssignedStorage = $derived(authContext.user?.assigned_storage ?? 0);
</script>

<div class="flex size-full min-h-0 flex-col overflow-hidden">
  <Topbar>
    {#snippet left()}
      <h1 class="ml-2 text-lg font-semibold tracking-tight">Storage</h1>
    {/snippet}

    {#snippet right()}
      <!-- Workspace Selector -->
      <Select.Root type="single" bind:value={selectedValue}>
        <Select.Trigger
          class="flex h-8 w-60 items-center justify-between text-xs"
        >
          <span class="truncate">{selectedLabel}</span>
        </Select.Trigger>
        <Select.Content>
          <!-- All Cloud Storage -->
          <Select.Group>
            <Select.GroupHeading>Cloud Overview</Select.GroupHeading>
            <Select.Item value="cloud:all" label="All Cloud Storage">
              <div class="flex items-center gap-2">
                <icons.Cloud class="text-primary size-4 shrink-0" />
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
        </Select.Content>
      </Select.Root>
    {/snippet}
  </Topbar>

  <!-- Storage View Body -->
  <main class="max-h-[calc(100vh-3rem)] flex-1 overflow-auto!">
    <div class="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <StorageViewer
        title={selectedLabel}
        usedStorage={currentUsedStorage}
        assignedStorage={currentAssignedStorage}
        isLocal={false}
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
