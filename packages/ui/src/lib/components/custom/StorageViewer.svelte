<script lang="ts">
  import * as Card from "../ui/card";
  import * as Table from "../ui/table";
  import * as Select from "../ui/select";
  import * as DropdownMenu from "../ui/dropdown-menu";
  import { Button } from "../ui/button";
  import { Input } from "../ui/input";
  import { Badge } from "../ui/badge";
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
    page = $bindable(1),
    limit = 10,
    search = $bindable(""),
    mediaType = $bindable("all"),
    sortBy = $bindable("created_at"),
    sortOrder = $bindable("desc"),
    isLoading = false,
    title,
    onRefresh,
    onDelete,
    onOpen,
  }: {
    usedStorage?: number;
    assignedStorage?: number;
    isLocal?: boolean;
    assets?: StorageAssetItem[];
    total?: number;
    page?: number;
    limit?: number;
    search?: string;
    mediaType?: string;
    sortBy?: string;
    sortOrder?: string;
    isLoading?: boolean;
    title?: string;
    onRefresh?: () => void;
    onDelete?: (id: string, name: string) => void;
    onOpen?: (asset: StorageAssetItem) => void;
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
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.startsWith("text/")
    )
      return icons.FileText;
    return icons.File;
  }

  function getCleanMimeLabel(mimeType: string) {
    if (mimeType.startsWith("image/"))
      return mimeType.replace("image/", "").toUpperCase();
    if (mimeType.startsWith("video/"))
      return mimeType.replace("video/", "").toUpperCase();
    if (mimeType.startsWith("audio/"))
      return mimeType.replace("audio/", "").toUpperCase();
    if (mimeType.includes("pdf")) return "PDF";
    return mimeType.split("/")[1]?.toUpperCase() || "FILE";
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    search = target.value;
    page = 1;
  }

  function handleTypeSelect(val: string | undefined) {
    if (!val) return;
    mediaType = val;
    page = 1;
  }

  function handleSortSelect(val: string | undefined) {
    if (!val) return;
    const [sb, so] = val.split(":");
    sortBy = sb;
    sortOrder = so;
    page = 1;
  }

  function handleOpenFile(asset: StorageAssetItem) {
    if (onOpen) {
      onOpen(asset);
    } else {
      window.open(asset.path, "_blank");
    }
  }

  const mediaTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
    { value: "audio", label: "Audio" },
    { value: "document", label: "Documents" },
    { value: "other", label: "Other" },
  ];

  const sortOptions = [
    { value: "created_at:desc", label: "Newest First" },
    { value: "created_at:asc", label: "Oldest First" },
    { value: "size:desc", label: "Largest Size" },
    { value: "size:asc", label: "Smallest Size" },
    { value: "name:asc", label: "Name (A-Z)" },
    { value: "name:desc", label: "Name (Z-A)" },
  ];
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
              style="width: {Math.min(100, storagePercentage)}%"
            ></div>
          </div>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Storage Files List Card -->
  <Card.Root class="overflow-hidden">
    <Card.Header
      class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b py-4"
    >
      <Card.Title class="flex items-center gap-2 shrink-0">
        <icons.Folder class="size-5 text-primary" />
        <div class="flex flex-col">
          {title || (isLocal ? "Local Assets" : "Cloud Assets")}
        </div>
      </Card.Title>

      <!-- Filters & Controls Bar -->
      <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <!-- Search Input -->
        <div class="relative flex items-center flex-1 sm:w-56 min-w-35">
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

        <!-- Media Type Select -->
        <Select.Root
          type="single"
          value={mediaType}
          onValueChange={handleTypeSelect}
        >
          <Select.Trigger class="h-9 w-32.5 text-xs">
            <div class="flex items-center gap-1.5 truncate">
              <icons.SlidersHorizontal
                class="size-3.5 text-muted-foreground shrink-0"
              />
              <span class="truncate">
                {mediaTypeOptions.find((o) => o.value === mediaType)?.label ||
                  "Type"}
              </span>
            </div>
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupHeading>Filter by Type</Select.GroupHeading>
              {#each mediaTypeOptions as option}
                <Select.Item
                  value={option.value}
                  label={option.label}
                  class="text-xs"
                >
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>

        <!-- Sort Select -->
        <Select.Root
          type="single"
          value={`${sortBy}:${sortOrder}`}
          onValueChange={handleSortSelect}
        >
          <Select.Trigger class="h-9 w-35 text-xs">
            <div class="flex items-center gap-1.5 truncate">
              <icons.SlidersHorizontal
                class="size-3.5 text-muted-foreground shrink-0"
              />
              <span class="truncate">
                {sortOptions.find((o) => o.value === `${sortBy}:${sortOrder}`)
                  ?.label || "Sort"}
              </span>
            </div>
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupHeading>Sort Order</Select.GroupHeading>
              {#each sortOptions as option}
                <Select.Item
                  value={option.value}
                  label={option.label}
                  class="text-xs"
                >
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>

        <!-- Refresh Button -->
        {#if onRefresh}
          <Button
            variant="outline"
            size="icon"
            class="h-9 w-9 shrink-0"
            onclick={onRefresh}
            disabled={isLoading}
            title="Refresh assets"
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
          class="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3"
        >
          <BarSpinner size={36} />
          <p class="text-sm">Loading storage assets...</p>
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
              {search || mediaType !== "all"
                ? "No assets match your search and filter criteria."
                : "You haven't uploaded any media or note snapshots yet."}
            </p>
          </div>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <Table.Root class="w-full">
            <Table.Header class="bg-muted/40">
              <Table.Row class="hover:bg-transparent">
                <Table.Head class="w-[45%] text-xs font-semibold"
                  >Name</Table.Head
                >
                <Table.Head class="text-xs font-semibold">Type</Table.Head>
                <Table.Head class="text-xs font-semibold">Size</Table.Head>
                <Table.Head class="text-xs font-semibold">Uploaded</Table.Head>
                <Table.Head class="text-right text-xs font-semibold pr-6"
                  >Actions</Table.Head
                >
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each assets as asset (asset.id)}
                {@const Icon = getFileIcon(asset.mime_type)}
                <Table.Row class="group hover:bg-muted/30 transition-colors">
                  <!-- Name & Icon -->
                  <Table.Cell class="font-medium py-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                      >
                        <Icon class="size-4" />
                      </div>
                      <span
                        class="text-sm font-medium leading-none truncate text-foreground hover:underline cursor-pointer"
                        title={asset.name}
                        onclick={() => handleOpenFile(asset)}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) =>
                          e.key === "Enter" && handleOpenFile(asset)}
                      >
                        {asset.name}
                      </span>
                    </div>
                  </Table.Cell>

                  <!-- Type Badge -->
                  <Table.Cell class="py-3">
                    <Badge
                      variant="outline"
                      class="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5"
                    >
                      {getCleanMimeLabel(asset.mime_type)}
                    </Badge>
                  </Table.Cell>

                  <!-- Size -->
                  <Table.Cell
                    class="py-3 font-mono text-xs text-muted-foreground"
                  >
                    {formatBytes(asset.size)}
                  </Table.Cell>

                  <!-- Date -->
                  <Table.Cell
                    class="py-3 text-xs text-muted-foreground whitespace-nowrap"
                  >
                    {timeAgo(asset.created_at)}
                  </Table.Cell>

                  <!-- Actions -->
                  <Table.Cell class="py-3 text-right pr-6">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Actions"
                        >
                          <icons.EllipsisVertical class="size-4" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" class="w-36">
                        <DropdownMenu.Item
                          onclick={() => handleOpenFile(asset)}
                          class="cursor-pointer"
                        >
                          <icons.ExternalLink class="size-4 mr-2" />
                          <span>Open File</span>
                        </DropdownMenu.Item>
                        {#if onDelete}
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            class="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                            onclick={() => onDelete(asset.id, asset.name)}
                          >
                            <icons.Trash2 class="size-4 mr-2 text-red-500" />
                            <span>Delete File</span>
                          </DropdownMenu.Item>
                        {/if}
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    </Card.Content>

    <!-- Pagination Footer -->
    {#if total > 0}
      {@const totalPages = Math.ceil(total / limit)}
      <Card.Footer
        class="flex items-center justify-between border-t px-6 py-4 bg-muted/10"
      >
        <span class="text-xs text-muted-foreground">
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
          ({total} total assets)
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-8 text-xs"
            disabled={page <= 1 || isLoading}
            onclick={() => (page -= 1)}
          >
            <icons.ChevronLeft class="size-3.5" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-8 text-xs"
            disabled={page >= totalPages || isLoading}
            onclick={() => (page += 1)}
          >
            Next
            <icons.ChevronRight class="size-3.5" />
          </Button>
        </div>
      </Card.Footer>
    {/if}
  </Card.Root>
</div>
