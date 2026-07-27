<script lang="ts">
  import * as Card from "../ui/card";
  import { Button } from "../ui/button";
  import { Input } from "../ui/input";
  import { BarSpinner, icons } from "../../icons";
  import { cn, timeAgo } from "../../utils";

  export interface StorageAssetItem {
    id: string;
    name: string;
    path: string;
    mime_type: string;
    size: number;
    created_at: Date | string;
    updated_at?: Date | string;
  }

  let {
    usedStorage = 0,
    assignedStorage = 0,
    isLocal = false,
    assets = [],
    total = 0,
    page = 1,
    limit = 10,
    search = $bindable(""),
    isLoading = false,
    onSearchChange,
    onPageChange,
    onRefresh,
    onDelete,
  }: {
    usedStorage?: number;
    assignedStorage?: number;
    isLocal?: boolean;
    assets?: StorageAssetItem[];
    total?: number;
    page?: number;
    limit?: number;
    search?: string;
    isLoading?: boolean;
    onSearchChange?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onRefresh?: () => void;
    onDelete?: (id: string, name: string) => void;
  } = $props();

  const storagePercentage = $derived(
    assignedStorage > 0 ? (usedStorage / assignedStorage) * 100 : 0,
  );

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return icons.Image;
    if (mimeType.startsWith("video/")) return icons.Video;
    if (mimeType.startsWith("audio/")) return icons.Music;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return icons.FileText;
    return icons.File;
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    search = target.value;
    onSearchChange?.(target.value);
  }
</script>

<div class="space-y-6">
  <!-- Storage Overview Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <icons.HardDrive class="size-5 text-primary" />
        Storage & Usage
      </Card.Title>
      <Card.Description>
        {isLocal || assignedStorage <= 0
          ? "Overview of your local assets directory storage."
          : "Overview of your assigned cloud storage usage."}
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="space-y-2">
        <div class="flex justify-between items-end">
          <span class="text-sm font-medium">Used Space</span>
          <span class="text-xs text-muted-foreground font-mono">
            {#if isLocal || assignedStorage <= 0}
              {formatBytes(usedStorage)}
            {:else}
              {formatBytes(usedStorage)} / {formatBytes(assignedStorage)}
            {/if}
          </span>
        </div>
        {#if !isLocal && assignedStorage > 0}
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500"
              style="width: {storagePercentage}%"
            ></div>
          </div>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Storage Files List Card -->
  <Card.Root>
    <Card.Header
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div>
        <Card.Title class="flex items-center gap-2">
          <icons.Folder class="size-5 text-primary" />
          {isLocal ? "Local Assets" : "Cloud Assets"}
        </Card.Title>
        <Card.Description>
          Search, view, and manage your stored media files.
        </Card.Description>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative flex items-center w-full sm:w-64">
          <icons.Search
            class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10"
          />
          <Input
            type="text"
            placeholder="Search files..."
            class="pl-9 h-9 text-sm"
            value={search}
            oninput={handleInput}
          />
        </div>
        {#if onRefresh}
          <Button
            variant="outline"
            size="icon"
            class="h-9 w-9 shrink-0"
            onclick={onRefresh}
            disabled={isLoading}
          >
            <icons.RefreshCw
              class={cn("size-4", isLoading && "animate-spin")}
            />
          </Button>
        {/if}
      </div>
    </Card.Header>

    <Card.Content class="p-0">
      {#if isLoading && assets.length === 0}
        <div
          class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2"
        >
          <BarSpinner size={32} />
          <p class="text-sm">Loading your storage files...</p>
        </div>
      {:else if assets.length === 0}
        <div
          class="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3"
        >
          <div class="rounded-full bg-muted p-4">
            <icons.FileX class="size-8 text-muted-foreground/60" />
          </div>
          <div class="space-y-1">
            <p class="text-base font-medium text-foreground">No files found</p>
            <p class="text-xs text-muted-foreground">
              {search
                ? "No assets match your search query."
                : "You haven't uploaded any media or note snapshots yet."}
            </p>
          </div>
        </div>
      {:else}
        <div class="divide-y border-t border-b">
          {#each assets as asset (asset.id)}
            {@const Icon = getFileIcon(asset.mime_type)}
            <div
              class="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div
                  class="flex size-10 items-center justify-center rounded-lg bg-muted shrink-0 text-muted-foreground"
                >
                  <Icon class="size-5" />
                </div>
                <div class="space-y-0.5 min-w-0 flex-1">
                  <p
                    class="text-sm font-medium leading-none truncate text-foreground"
                    title={asset.name}
                  >
                    {asset.name}
                  </p>
                  <div
                    class="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span class="font-mono">{formatBytes(asset.size)}</span>
                    <span>•</span>
                    <span>{timeAgo(asset.created_at)}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  class="gap-1.5 h-8 text-xs"
                  href={asset.path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <icons.ExternalLink class="size-3.5" />
                  View
                </Button>
                {#if onDelete}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onclick={() => onDelete(asset.id, asset.name)}
                  >
                    <icons.Trash2 class="size-4" />
                  </Button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>

    <!-- Pagination Footer -->
    {#if total > 0}
      {@const totalPages = Math.ceil(total / limit)}
      <Card.Footer class="flex items-center justify-between border-t px-6 py-4">
        <span class="text-xs text-muted-foreground">
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
          ({total} total)
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-8 text-xs"
            disabled={page <= 1 || isLoading}
            onclick={() => onPageChange?.(page - 1)}
          >
            <icons.ChevronLeft class="size-3.5" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-8 text-xs"
            disabled={page >= totalPages || isLoading}
            onclick={() => onPageChange?.(page + 1)}
          >
            Next
            <icons.ChevronRight class="size-3.5" />
          </Button>
        </div>
      </Card.Footer>
    {/if}
  </Card.Root>
</div>
