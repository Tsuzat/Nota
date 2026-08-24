<script lang="ts">
import Cloud from "@lucide/svelte/icons/cloud";
import ExternalLink from "@lucide/svelte/icons/external-link";
import File from "@lucide/svelte/icons/file";
import FileAudio from "@lucide/svelte/icons/file-audio";
import FileImage from "@lucide/svelte/icons/file-image";
import FileText from "@lucide/svelte/icons/file-text";
import FileVideo from "@lucide/svelte/icons/file-video";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import History from "@lucide/svelte/icons/history";
import Image from "@lucide/svelte/icons/image";
import RefreshCw from "@lucide/svelte/icons/refresh-cw";
import Search from "@lucide/svelte/icons/search";
import Trash2 from "@lucide/svelte/icons/trash-2";
import { toast } from "@nota/ui";
import { openDeleteConfirmation } from "@nota/ui/custom/dialogs/confirm-delete.svelte";
import { IconsRenderer } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.ts";
import { Input } from "@nota/ui/shadcn/input/index.js";
import * as Select from "@nota/ui/shadcn/select/index.ts";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.js";
import * as Tabs from "@nota/ui/shadcn/tabs/index.ts";
import * as Tooltip from "@nota/ui/shadcn/tooltip/index.ts";
import { appDataDir, resolve as resolvePath } from "@tauri-apps/api/path";
import { exists, readDir } from "@tauri-apps/plugin-fs";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { onDestroy, onMount, untrack } from "svelte";
import { fade } from "svelte/transition";
import { Topbar } from "#lib/components/custom/index.ts";
import {
	snapshotsManager,
	type UnifiedSnapshotItem,
} from "#lib/data/snapshots.svelte.ts";
import {
	storageManager,
	type UnifiedAssetItem,
	type UnifiedStorageStats,
} from "#lib/data/storage.svelte.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { formatBytes, formatDate, ISDESKTOP } from "#lib/utils.ts";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

const workspaceCtx = getWorkspaceContext();

// Workspaces
const cloudWorkspaces = $derived(workspaceCtx.cloud.workspaces);
const localWorkspaces = $derived(workspaceCtx.local.workspaces);
const allWorkspaces = $derived([
	...cloudWorkspaces,
	...(ISDESKTOP ? localWorkspaces : []),
]);

onMount(async () => {
	if (ISDESKTOP) {
		try {
			await workspaceCtx.init();
		} catch (e) {
			console.error("[Storage] Failed to initialize local workspaces:", e);
		}
	}
});

let activeTab = $state<"media" | "snapshots">("media");
let filterWorkspaceId = $state<string>("all-cloud");
let searchQuery = $state("");
let selectedSort = $state<"createdAt" | "name" | "size">("createdAt");
let sortOrder = $state<"asc" | "desc">("desc");
let currentPage = $state(1);
const limit = 15;
let refreshKey = $state(0);

const sortOptions = [
	{ value: "createdAt", label: "Sort: Date" },
	{ value: "name", label: "Sort: Name" },
	{ value: "size", label: "Sort: Size" },
] as const;

const selectedSortLabel = $derived(
	sortOptions.find((s) => s.value === selectedSort)?.label ?? "Sort: Date",
);

// Strictly check whether the selected context is Cloud or Local
const isCloudContext = $derived.by(() => {
	if (filterWorkspaceId === "all-cloud") return true;
	if (filterWorkspaceId === "all-local") return false;
	const isLocal = localWorkspaces.some((w: any) => w.id === filterWorkspaceId);
	if (isLocal) return false;
	const isCloud = cloudWorkspaces.some((w: any) => w.id === filterWorkspaceId);
	if (isCloud) return true;
	return true;
});

const actualWorkspaceId = $derived(
	filterWorkspaceId === "all-cloud" || filterWorkspaceId === "all-local"
		? undefined
		: filterWorkspaceId,
);

const selectedWorkspaceLabel = $derived.by(() => {
	if (filterWorkspaceId === "all-cloud") {
		return `All Cloud Workspaces (${cloudWorkspaces.length})`;
	}
	if (filterWorkspaceId === "all-local") {
		return `All Local Workspaces (${localWorkspaces.length})`;
	}
	const ws = allWorkspaces.find((w) => w.id === filterWorkspaceId);
	return ws ? ws.name : "Select Workspace";
});

// In-memory cache for page lifetime, destroyed on page exit
interface CacheStore {
	stats: Map<string, UnifiedStorageStats>;
	media: Map<
		string,
		{ items: UnifiedAssetItem[]; total: number; totalSizeBytes: number }
	>;
	snapshots: Map<
		string,
		{ items: UnifiedSnapshotItem[]; total: number; totalSizeBytes: number }
	>;
}

const pageCache: CacheStore = {
	stats: new Map(),
	media: new Map(),
	snapshots: new Map(),
};

// Destroy cache when navigating away from the page
onDestroy(() => {
	console.log("[Storage] Destroying storage page cache on exit");
	pageCache.stats.clear();
	pageCache.media.clear();
	pageCache.snapshots.clear();
});

// Data states
let statsData = $state<UnifiedStorageStats | null>(null);
let statsLoading = $state(true);

let mediaData = $state<{
	items: UnifiedAssetItem[];
	total: number;
	totalSizeBytes: number;
}>({
	items: [],
	total: 0,
	totalSizeBytes: 0,
});
let mediaLoading = $state(false);

let snapshotsData = $state<{
	items: UnifiedSnapshotItem[];
	total: number;
	totalSizeBytes: number;
}>({
	items: [],
	total: 0,
	totalSizeBytes: 0,
});
let snapshotsLoading = $state(false);

// Load Stats (with caching)
async function loadStats(forceFresh = false) {
	const isCloud = isCloudContext;
	const wsId = actualWorkspaceId;
	const statsKey = `${isCloud}:${wsId ?? "all"}`;

	if (!forceFresh && pageCache.stats.has(statsKey)) {
		statsData = pageCache.stats.get(statsKey)!;
		statsLoading = false;
		return;
	}

	statsLoading = true;
	try {
		const res = await storageManager.fetchStats(isCloud, wsId);
		statsData = res;
		pageCache.stats.set(statsKey, res);
	} catch (e) {
		console.error("[Storage] Failed to load storage stats:", e);
	} finally {
		statsLoading = false;
	}
}

// Load Media Assets (with caching)
async function loadMedia(forceFresh = false) {
	const isCloud = isCloudContext;
	const wsId = actualWorkspaceId;
	const q = searchQuery.trim();
	const s = selectedSort;
	const o = sortOrder;
	const p = currentPage;
	const mediaKey = `${isCloud}:${wsId ?? "all"}:${q}:${s}:${o}:${p}:${limit}`;

	if (!forceFresh && pageCache.media.has(mediaKey)) {
		const cached = pageCache.media.get(mediaKey)!;
		mediaData = cached;
		mediaLoading = false;
		return;
	}

	mediaLoading = true;
	try {
		const res = await storageManager.fetchAssets(isCloud, {
			workspaceId: wsId,
			searchTerm: q || undefined,
			limit,
			offset: (p - 1) * limit,
			sortBy: s,
			sortOrder: o,
		});
		mediaData = res;
		pageCache.media.set(mediaKey, res);
		console.log("[Storage] Media assets loaded:", res.items);
	} catch (e) {
		console.error("[Storage] Failed to load media assets:", e);
	} finally {
		mediaLoading = false;
	}
}

// Load Snapshots (with caching)
async function loadSnapshots(forceFresh = false) {
	const isCloud = isCloudContext;
	const wsId = actualWorkspaceId;
	const q = searchQuery.trim();
	const s = selectedSort;
	const o = sortOrder;
	const p = currentPage;
	const snapshotsKey = `${isCloud}:${wsId ?? "all"}:${q}:${s}:${o}:${p}:${limit}`;

	if (!forceFresh && pageCache.snapshots.has(snapshotsKey)) {
		const cached = pageCache.snapshots.get(snapshotsKey)!;
		snapshotsData = cached;
		snapshotsLoading = false;
		return;
	}

	snapshotsLoading = true;
	try {
		const res = await snapshotsManager.fetchWorkspaceSnapshots(wsId, isCloud, {
			search: q || undefined,
			limit,
			offset: (p - 1) * limit,
			sortBy: s,
			sortOrder: o,
		});
		const formatted = {
			items: res.items,
			total: res.total,
			totalSizeBytes: res.items.reduce((acc, s) => acc + s.size, 0),
		};
		snapshotsData = formatted;
		pageCache.snapshots.set(snapshotsKey, formatted);
		console.log("[Storage] Snapshots loaded:", formatted.items);
	} catch (e) {
		console.error("[Storage] Failed to load snapshots:", e);
	} finally {
		snapshotsLoading = false;
	}
}

// Invalidate cache and reload
function invalidateAndReload() {
	pageCache.stats.clear();
	pageCache.media.clear();
	pageCache.snapshots.clear();
	refreshKey++;
}

// Reactive tracking using untrack to prevent infinite effect update depth
$effect(() => {
	const _ws = filterWorkspaceId;
	const _k = refreshKey;
	const _tab = activeTab;
	const _q = searchQuery;
	const _s = selectedSort;
	const _o = sortOrder;
	const _p = currentPage;

	untrack(() => {
		loadStats(_k > 0);
		if (_tab === "media") {
			loadMedia(_k > 0);
		} else {
			loadSnapshots(_k > 0);
		}
	});
});

// Computed pagination
const totalItems = $derived(
	activeTab === "media" ? mediaData.total : snapshotsData.total,
);
const totalPages = $derived(Math.max(1, Math.ceil(totalItems / limit)));

// Actions
async function openMedia(item: UnifiedAssetItem) {
	console.log("[Storage] Opening media item:", {
		id: item.id,
		name: item.name,
		mimeType: item.mimeType,
		size: item.size,
		path: item.path,
		isCloud: item.isCloud,
		noteName: item.noteName,
		workspaceName: item.workspaceName,
	});

	if (item.isCloud) {
		// Cloud media -> open in browser / web
		const url = item.path;
		if (!url) {
			toast.error("Cloud file URL not found");
			return;
		}

		console.log("[Storage] Opening cloud file in web browser:", url);
		if (ISDESKTOP) {
			try {
				await openUrl(url);
			} catch (err) {
				console.warn("[Storage] openUrl failed, opening via window.open:", err);
				window.open(url, "_blank");
			}
		} else {
			window.open(url, "_blank");
		}
	} else {
		// Local media -> open in OS native viewer / app
		if (!ISDESKTOP) {
			toast.error("Local files are only accessible in the desktop application");
			return;
		}

		try {
			let targetPath = item.path;

			// If targetPath is not directly recorded or valid, resolve from appDataDir/assets
			if (!targetPath || !(await exists(targetPath))) {
				const assetsFolder = await resolvePath(await appDataDir(), "assets");
				const dirExists = await exists(assetsFolder);
				if (dirExists) {
					const entries = await readDir(assetsFolder);
					// Try finding file that matches name (e.g., `xxx-filename.ext` or `filename.ext`)
					const match = entries.find(
						(e) => e.name === item.name || e.name.endsWith(`-${item.name}`),
					);
					if (match) {
						targetPath = await resolvePath(assetsFolder, match.name);
					} else {
						targetPath = assetsFolder; // Fallback: open assets directory
					}
				}
			}

			if (targetPath) {
				console.log(
					"[Storage] Opening local file in OS native viewer:",
					targetPath,
				);
				await openPath(targetPath);
			} else {
				throw new Error("Could not locate file path on disk");
			}
		} catch (err: any) {
			console.error("[Storage] Failed to open local file:", err);
			toast.error("Failed to open file: " + (err?.message || err));
		}
	}
}

function confirmDeleteAsset(item: UnifiedAssetItem) {
	openDeleteConfirmation({
		title: "Delete File?",
		description: `Are you sure you want to delete "${item.name}"?`,
		warning: {
			allowDelete: true,
			text: "This file will be permanently deleted from storage. This action cannot be undone.",
		},
		onClick: async () => {
			try {
				await storageManager.deleteAsset(item.id, item.isCloud);
				toast.success("File deleted successfully");
				invalidateAndReload();
			} catch (e: any) {
				toast.error(e?.message || "Failed to delete file");
			}
		},
	});
}

function confirmDeleteSnapshot(item: UnifiedSnapshotItem) {
	openDeleteConfirmation({
		title: "Delete Snapshot?",
		description: `Are you sure you want to delete this snapshot for "${item.noteName}"?`,
		warning: {
			allowDelete: true,
			text: "This snapshot will be permanently deleted. This action cannot be undone.",
		},
		onClick: async () => {
			try {
				await snapshotsManager.deleteSnapshot(item.id, item.isCloud);
				toast.success("Snapshot deleted successfully");
				invalidateAndReload();
			} catch (e: any) {
				toast.error(e?.message || "Failed to delete snapshot");
			}
		},
	});
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) return FileImage;
	if (mimeType.startsWith("video/")) return FileVideo;
	if (mimeType.startsWith("audio/")) return FileAudio;
	if (
		mimeType.includes("pdf") ||
		mimeType.includes("document") ||
		mimeType.includes("text")
	)
		return FileText;
	return File;
}
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <Topbar class="shrink-0" />

  <div class="min-h-0 max-h-[calc(100vh-4rem)] flex-1 overflow-y-auto">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <!-- Header -->
      <header class="flex flex-col gap-4 border-b border-border/40 pb-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
                Storage
              </h1>
              {#if isCloudContext}
                <Badge variant="secondary" class="gap-1">
                  <Cloud data-icon="inline-start" />
                  Cloud
                </Badge>
              {:else}
                <Badge variant="secondary" class="gap-1">
                  <HardDrive data-icon="inline-start" />
                  Local
                </Badge>
              {/if}
            </div>
            <p class="text-xs text-muted-foreground sm:text-sm">
              Manage uploaded media assets and note snapshots across your workspaces.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={invalidateAndReload}
              title="Refresh Storage Data"
            >
              <RefreshCw data-icon="inline-start" />
              Refresh
            </Button>
          </div>
        </div>

        <!-- Storage Overview Stats -->
        <div class="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          <!-- Total Storage Card -->
          <Card.Root class="relative overflow-hidden border-border/60 p-4">
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-muted-foreground">Total Storage Used</span>
                <span class="text-xl font-bold tracking-tight">
                  {#if statsLoading}
                    <Skeleton class="h-6 w-20" />
                  {:else}
                    {formatBytes(statsData?.totalUsedBytes ?? 0)}
                  {/if}
                </span>
              </div>
              <div class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HardDrive class="size-4" />
              </div>
            </div>
            {#if statsData?.quota}
              {@const percent = Math.min(100, Math.round(((statsData.totalUsedBytes ?? 0) / (statsData.quota.assignedStorageBytes || 1)) * 100))}
              <div class="mt-3 flex flex-col gap-1.5">
                <div class="flex justify-between text-[0.7rem] text-muted-foreground">
                  <span>{percent}% of {formatBytes(statsData.quota.assignedStorageBytes)}</span>
                  <span class="capitalize">{statsData.quota.planTier} Plan</span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    class="h-full bg-primary transition-all duration-300"
                    style={`width: ${percent}%`}
                  ></div>
                </div>
              </div>
            {:else}
              <div class="mt-3 text-[0.7rem] text-muted-foreground">
                Local on-device storage
              </div>
            {/if}
          </Card.Root>

          <!-- Media Size Card -->
          <Card.Root class="relative overflow-hidden border-border/60 p-4">
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-muted-foreground">Media Assets</span>
                <span class="text-xl font-bold tracking-tight">
                  {#if statsLoading}
                    <Skeleton class="h-6 w-20" />
                  {:else}
                    {formatBytes(statsData?.media.sizeBytes ?? 0)}
                  {/if}
                </span>
              </div>
              <div class="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Image class="size-4" />
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between text-[0.7rem] text-muted-foreground">
              <span>{statsData?.media.count ?? 0} {statsData?.media.count === 1 ? "file" : "files"}</span>
              <span>Images & attachments</span>
            </div>
          </Card.Root>

          <!-- Snapshots Size Card -->
          <Card.Root class="relative overflow-hidden border-border/60 p-4">
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-muted-foreground">Note Snapshots</span>
                <span class="text-xl font-bold tracking-tight">
                  {#if statsLoading}
                    <Skeleton class="h-6 w-20" />
                  {:else}
                    {formatBytes(statsData?.snapshots.sizeBytes ?? 0)}
                  {/if}
                </span>
              </div>
              <div class="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <History class="size-4" />
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between text-[0.7rem] text-muted-foreground">
              <span>{statsData?.snapshots.count ?? 0} {statsData?.snapshots.count === 1 ? "version" : "versions"}</span>
              <span>Point-in-time backups</span>
            </div>
          </Card.Root>
        </div>

        <!-- Filter & Navigation Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
          <!-- Segmented Tab Switcher -->
          <Tabs.Root
            value={activeTab}
            onValueChange={(val) => {
              if (val === "media" || val === "snapshots") {
                activeTab = val;
                currentPage = 1;
              }
            }}
          >
            <Tabs.List class="h-8">
              <Tabs.Trigger value="media" class="gap-1.5 px-3 text-xs">
                <FileImage class="size-3.5" />
                <span>Media Assets</span>
                {#if statsData?.media.count !== undefined}
                  <span class="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.2 text-[0.65rem] font-medium">
                    {statsData.media.count}
                  </span>
                {/if}
              </Tabs.Trigger>
              <Tabs.Trigger value="snapshots" class="gap-1.5 px-3 text-xs">
                <History class="size-3.5" />
                <span>Snapshots</span>
                {#if statsData?.snapshots.count !== undefined}
                  <span class="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.2 text-[0.65rem] font-medium">
                    {statsData.snapshots.count}
                  </span>
                {/if}
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>

          <!-- Search & Filters -->
          <div class="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <!-- Search -->
            <div class="relative min-w-40 flex-1 max-w-xs">
              <Search
                class="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder={activeTab === "media" ? "Search media files..." : "Search snapshots..."}
                bind:value={searchQuery}
                oninput={() => (currentPage = 1)}
                class="h-8 pl-8 text-xs"
              />
            </div>

            <!-- Workspace Selector with Subheadings -->
            <Select.Root
              type="single"
              bind:value={filterWorkspaceId}
              onValueChange={() => (currentPage = 1)}
            >
              <Select.Trigger
                class="h-8 min-w-40 max-w-64 text-xs"
                aria-label="Filter by workspace"
              >
                <span class="truncate">{selectedWorkspaceLabel}</span>
              </Select.Trigger>
              <Select.Content>
                <!-- Cloud Workspaces Group -->
                <Select.Group>
                  <Select.GroupHeading>Cloud Workspaces</Select.GroupHeading>
                  {#each cloudWorkspaces as ws (ws.id)}
                    <Select.Item value={ws.id} label={ws.name}>
                      <IconsRenderer
                        icon={ws.icon ?? "lucide:folder"}
                        class="text-sm!"
                      />
                      <span class="truncate">{ws.name}</span>
                    </Select.Item>
                  {/each}
                  <Select.Item value="all-cloud" label="All Cloud Workspaces">
                    <Cloud class="size-3.5 text-muted-foreground" />
                    <span class="font-medium">All Cloud Workspaces</span>
                  </Select.Item>
                </Select.Group>

                <!-- Local Workspaces Group -->
                {#if ISDESKTOP && localWorkspaces.length > 0}
                  <Select.Separator />
                  <Select.Group>
                    <Select.GroupHeading>Local Workspaces</Select.GroupHeading>
                    {#each localWorkspaces as ws (ws.id)}
                      <Select.Item value={ws.id} label={ws.name}>
                        <IconsRenderer
                          icon={ws.icon ?? "lucide:folder"}
                          class="text-sm!"
                        />
                        <span class="truncate">{ws.name}</span>
                      </Select.Item>
                    {/each}
                    <Select.Item value="all-local" label="All Local Workspaces">
                      <HardDrive class="size-3.5 text-muted-foreground" />
                      <span class="font-medium">All Local Workspaces</span>
                    </Select.Item>
                  </Select.Group>
                {/if}
              </Select.Content>
            </Select.Root>

            <!-- Sort Selector -->
            <Select.Root
              type="single"
              bind:value={selectedSort}
              onValueChange={() => (currentPage = 1)}
            >
              <Select.Trigger
                class="h-8 min-w-32 text-xs"
                aria-label="Sort items"
              >
                <span class="truncate">{selectedSortLabel}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.GroupHeading>Sort By</Select.GroupHeading>
                  {#each sortOptions as opt (opt.value)}
                    <Select.Item value={opt.value} label={opt.label}>
                      {opt.label}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>

            <!-- Sort Direction Toggle -->
            <Button
              variant="outline"
              size="icon-xs"
              onclick={() => {
                sortOrder = sortOrder === "asc" ? "desc" : "asc";
                currentPage = 1;
              }}
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              <span class="text-xs font-semibold">
                {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <!-- Main Content List -->
      {#if activeTab === "media"}
        <!-- Media Assets Tab Content -->
        {#if mediaLoading}
          <div class="flex flex-col gap-3">
            {#each [1, 2, 3, 4, 5] as item (item)}
              <Card.Root class="py-3">
                <Card.Header class="gap-2">
                  <Skeleton class="h-4 w-1/3" />
                  <Skeleton class="h-3 w-1/2" />
                </Card.Header>
              </Card.Root>
            {/each}
          </div>
        {:else if mediaData.items.length === 0}
          <Card.Root class="mx-auto w-full max-w-md border-dashed">
            <Card.Header class="text-center">
              <div
                class="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
              >
                <Image class="size-6" />
              </div>
              <Card.Title class="text-base font-semibold">
                No media assets found
              </Card.Title>
              <Card.Description>
                {#if searchQuery}
                  No files match your search query "{searchQuery}".
                {:else}
                  Images and attachments added to your notes will appear here.
                {/if}
              </Card.Description>
            </Card.Header>
          </Card.Root>
        {:else}
          <div class="flex flex-col gap-2.5" transition:fade={{ duration: 150 }}>
            {#each mediaData.items as item (item.id)}
              {@const FileIconComponent = getFileIcon(item.mimeType)}
              <Card.Root
                class="group/card border-border/60 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer"
                onclick={() => openMedia(item)}
              >
                <div class="flex flex-wrap items-center justify-between gap-3 px-4">
                  <!-- File Info -->
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover/card:text-foreground"
                    >
                      <FileIconComponent class="size-4" />
                    </div>

                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span
                          class="truncate text-sm font-semibold text-foreground group-hover/card:text-primary transition-colors"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {#if item.noteName}
                          <span class="text-xs text-muted-foreground flex items-center gap-1">
                            • <IconsRenderer icon={item.noteIcon ?? "lucide:file-text"} class="size-3" />
                            {item.noteName}
                          </span>
                        {/if}
                      </div>

                      <div
                        class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Badge
                          variant="secondary"
                          class="text-[0.65rem] uppercase tracking-wider"
                        >
                          {item.mimeType.split("/")[1] || item.mimeType}
                        </Badge>
                        <span>{formatBytes(item.size)}</span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                        {#if item.workspaceName}
                          <span>•</span>
                          <span class="truncate max-w-32">{item.workspaceName}</span>
                        {/if}
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1">
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            variant="ghost"
                            size="icon-sm"
                            onclick={(e) => {
                              e.stopPropagation();
                              openMedia(item);
                            }}
                          >
                            <ExternalLink class="size-3.5" />
                            <span class="sr-only">{item.isCloud ? "Open in web" : "Open in OS native app"}</span>
                          </Button>
                        {/snippet}
                      </Tooltip.Trigger>
                      <Tooltip.Content>{item.isCloud ? "Open in web" : "Open in OS native app"}</Tooltip.Content>
                    </Tooltip.Root>

                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            variant="ghost"
                            size="icon-sm"
                            class="text-muted-foreground hover:text-destructive"
                            onclick={(e) => {
                              e.stopPropagation();
                              confirmDeleteAsset(item);
                            }}
                          >
                            <Trash2 class="size-3.5" />
                            <span class="sr-only">Delete file</span>
                          </Button>
                        {/snippet}
                      </Tooltip.Trigger>
                      <Tooltip.Content>Delete</Tooltip.Content>
                    </Tooltip.Root>
                  </div>
                </div>
              </Card.Root>
            {/each}
          </div>
        {/if}
      {:else}
        <!-- Snapshots Tab Content -->
        {#if snapshotsLoading}
          <div class="flex flex-col gap-3">
            {#each [1, 2, 3, 4, 5] as item (item)}
              <Card.Root class="py-3">
                <Card.Header class="gap-2">
                  <Skeleton class="h-4 w-1/3" />
                  <Skeleton class="h-3 w-1/2" />
                </Card.Header>
              </Card.Root>
            {/each}
          </div>
        {:else if snapshotsData.items.length === 0}
          <Card.Root class="mx-auto w-full max-w-md border-dashed">
            <Card.Header class="text-center">
              <div
                class="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
              >
                <History class="size-6" />
              </div>
              <Card.Title class="text-base font-semibold">
                No snapshots found
              </Card.Title>
              <Card.Description>
                {#if searchQuery}
                  No snapshots match your search query "{searchQuery}".
                {:else}
                  Snapshots are automatically captured as you work, or created manually in Version History.
                {/if}
              </Card.Description>
            </Card.Header>
            <Card.Content class="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onclick={() => goto(resolve("/versions"))}
              >
                Go to Version History
              </Button>
            </Card.Content>
          </Card.Root>
        {:else}
          <div class="flex flex-col gap-2.5" transition:fade={{ duration: 150 }}>
            {#each snapshotsData.items as item (item.id)}
              <Card.Root
                class="group/card border-border/60 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div class="flex flex-wrap items-center justify-between gap-3 px-4">
                  <!-- Snapshot Info -->
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover/card:text-foreground"
                    >
                      <IconsRenderer
                        icon={item.noteIcon ?? "lucide:file-text"}
                        class="size-4"
                      />
                    </div>

                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span
                          class="truncate text-sm font-semibold text-foreground"
                        >
                          {item.noteName}
                        </span>
                        {#if item.label && item.label !== "Auto Snapshot"}
                          <span class="text-xs text-muted-foreground">
                            • {item.label}
                          </span>
                        {/if}
                      </div>

                      <div
                        class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Badge
                          variant={item.kind === "manual" ? "default" : "secondary"}
                          class="text-[0.65rem] uppercase tracking-wider"
                        >
                          {item.kind}
                        </Badge>
                        <span>{formatBytes(item.size)}</span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1">
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            variant="ghost"
                            size="icon-sm"
                            class="text-muted-foreground hover:text-destructive"
                            onclick={() => confirmDeleteSnapshot(item)}
                          >
                            <Trash2 class="size-3.5" />
                            <span class="sr-only">Delete snapshot</span>
                          </Button>
                        {/snippet}
                      </Tooltip.Trigger>
                      <Tooltip.Content>Delete</Tooltip.Content>
                    </Tooltip.Root>
                  </div>
                </div>
              </Card.Root>
            {/each}
          </div>
        {/if}
      {/if}

      <!-- Pagination -->
      <div class="flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <span>
          {#if activeTab === "media"}
            Showing {mediaData.items.length} of {mediaData.total} items
            {#if mediaData.totalSizeBytes > 0}
              ({formatBytes(mediaData.totalSizeBytes)})
            {/if}
          {:else}
            Showing {snapshotsData.items.length} of {snapshotsData.total} snapshots
          {/if}
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onclick={() => (currentPage = Math.max(1, currentPage - 1))}
          >
            Previous
          </Button>
          <span class="text-xs font-medium px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
