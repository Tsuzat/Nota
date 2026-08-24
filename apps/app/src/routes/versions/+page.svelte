<script lang="ts">
import Cloud from "@lucide/svelte/icons/cloud";
import Eye from "@lucide/svelte/icons/eye";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import History from "@lucide/svelte/icons/history";
import Plus from "@lucide/svelte/icons/plus";
import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
import Search from "@lucide/svelte/icons/search";
import Trash2 from "@lucide/svelte/icons/trash-2";
import { toast } from "@nota/ui";
import { openDeleteConfirmation } from "@nota/ui/custom/dialogs/confirm-delete.svelte";
import { createEditor, Edra } from "@nota/ui/edra/shadcn/index.js";
import type { Editor } from "@nota/ui/edra/tiptap/index.js";
import { BarSpinner, IconsRenderer } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.ts";
import * as Dialog from "@nota/ui/shadcn/dialog/index.ts";
import { Input } from "@nota/ui/shadcn/input/index.js";
import * as Select from "@nota/ui/shadcn/select/index.ts";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.js";
import * as Tooltip from "@nota/ui/shadcn/tooltip/index.ts";
import Collaboration from "@tiptap/extension-collaboration";
import { onDestroy } from "svelte";
import { fade } from "svelte/transition";
import * as Y from "yjs";
import { Topbar } from "#lib/components/custom/index.ts";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import {
	type SnapshotFilterOptions,
	snapshotsManager,
	type UnifiedSnapshotItem,
} from "#lib/data/snapshots.svelte.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { formatBytes, formatDate } from "#lib/utils.ts";
import { page } from "$app/state";

const workspaceCtx = getWorkspaceContext();
const noteCtx = getNotesContext();

const workspace = $derived(workspaceCtx.current);
const isCloudWorkspace = $derived(Boolean(workspace && "ownerId" in workspace));
const notes = $derived(noteCtx.list.filter((n) => !n.trashedAt));

const kindOptions = [
	{ value: "all", label: "All Kinds" },
	{ value: "auto", label: "Auto Snapshots" },
	{ value: "manual", label: "Manual Snapshots" },
] as const;

const sortOptions = [
	{ value: "createdAt", label: "Sort: Date" },
	{ value: "name", label: "Sort: Note Name" },
	{ value: "size", label: "Sort: Size" },
] as const;

// Filter & pagination state
let searchQuery = $state("");
let selectedNoteId = $state<string>(
	page.url.searchParams.get("noteId") ?? "all",
);

$effect(() => {
	const paramNoteId = page.url.searchParams.get("noteId");
	if (paramNoteId && paramNoteId !== selectedNoteId) {
		selectedNoteId = paramNoteId;
	}
});
let selectedKind = $state<"all" | "auto" | "manual">("all");
let selectedSort = $state<"createdAt" | "name" | "size">("createdAt");
let sortOrder = $state<"asc" | "desc">("desc");
let currentPage = $state(1);
const limit = 15;

const selectedNoteLabel = $derived(
	selectedNoteId === "all"
		? `All Notes (${notes.length})`
		: (notes.find((n) => n.id === selectedNoteId)?.name ?? "Select Note"),
);

const selectedKindLabel = $derived(
	kindOptions.find((k) => k.value === selectedKind)?.label ?? "All Kinds",
);

const selectedSortLabel = $derived(
	sortOptions.find((s) => s.value === selectedSort)?.label ?? "Sort: Date",
);

const createNoteLabel = $derived(
	notes.find((n) => n.id === createNoteId)?.name ?? "Select Note",
);

// Snapshot data state
let snapshots = $state<UnifiedSnapshotItem[]>([]);
let totalCount = $state(0);
let isLoading = $state(false);

// Manual snapshot dialog state
let createDialogOpen = $state(false);
let createNoteId = $state("");
let createLabel = $state("");
let isCreating = $state(false);

// Preview modal state
let previewOpen = $state(false);
let previewSnapshot = $state<UnifiedSnapshotItem | null>(null);
let previewLoading = $state(false);
let previewEditor = $state.raw<Editor>();
let previewDoc: Y.Doc | null = null;

// Restore dialog state
let restoreDialogOpen = $state(false);
let restoreTarget = $state<UnifiedSnapshotItem | null>(null);
let isRestoring = $state(false);

const totalPages = $derived(Math.max(1, Math.ceil(totalCount / limit)));

// Load snapshots
async function loadSnapshots() {
	if (!workspace) {
		snapshots = [];
		totalCount = 0;
		return;
	}

	isLoading = true;
	try {
		const options: SnapshotFilterOptions = {
			noteId: selectedNoteId === "all" ? undefined : selectedNoteId,
			kind: selectedKind === "all" ? undefined : selectedKind,
			search: searchQuery.trim() || undefined,
			sortBy: selectedSort,
			sortOrder,
			limit,
			offset: (currentPage - 1) * limit,
		};

		const res = await snapshotsManager.fetchWorkspaceSnapshots(
			workspace.id,
			isCloudWorkspace,
			options,
		);
		snapshots = res.items;
		totalCount = res.total;
	} catch (e) {
		console.error("Failed to load snapshots:", e);
		toast.error("Failed to load snapshots");
	} finally {
		isLoading = false;
	}
}

// Reactively reload on filter/page changes
$effect(() => {
	if (workspace) {
		// Read dependencies
		const _ws = workspace.id;
		const _note = selectedNoteId;
		const _kind = selectedKind;
		const _sort = selectedSort;
		const _order = sortOrder;
		const _page = currentPage;
		const _q = searchQuery;
		loadSnapshots();
	}
});

// Manual Snapshot Creation
async function handleCreateSnapshot() {
	if (!createNoteId || isCreating) return;
	isCreating = true;
	try {
		await snapshotsManager.createManualSnapshot(
			createNoteId,
			isCloudWorkspace,
			createLabel.trim() || undefined,
		);
		toast.success("Snapshot created successfully");
		createDialogOpen = false;
		createLabel = "";
		loadSnapshots();
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Failed to create snapshot";
		toast.error(msg);
	} finally {
		isCreating = false;
	}
}

// Preview Snapshot
async function openPreview(snapshot: UnifiedSnapshotItem) {
	cleanupPreview();
	previewSnapshot = snapshot;
	previewOpen = true;
	previewLoading = true;

	try {
		const data = await snapshotsManager.getSnapshotPreviewContent(
			snapshot.id,
			snapshot.isCloud,
		);

		if (data.type === "yjs") {
			previewDoc = new Y.Doc();
			Y.applyUpdate(previewDoc, data.content);
			previewEditor = createEditor({
				editable: false,
				collaborative: true,
				extensions: [Collaboration.configure({ document: previewDoc })],
			});
		} else {
			previewEditor = createEditor({ editable: false });
			previewEditor?.commands.setContent(data.content, {
				contentType: "json",
			});
		}
	} catch (e) {
		console.error("Failed to preview snapshot:", e);
		toast.error("Failed to load snapshot preview");
		previewOpen = false;
	} finally {
		previewLoading = false;
	}
}

function cleanupPreview() {
	if (previewEditor) {
		previewEditor.destroy();
		previewEditor = undefined;
	}
	if (previewDoc) {
		previewDoc.destroy();
		previewDoc = null;
	}
}

onDestroy(() => {
	cleanupPreview();
});

// Delete Snapshot Confirmation
function confirmDeleteSnapshot(snapshot: UnifiedSnapshotItem) {
	openDeleteConfirmation({
		title: "Delete Snapshot?",
		description: `Are you sure you want to delete this snapshot for "${snapshot.noteName}"?`,
		warning: {
			allowDelete: true,
			text: "This action cannot be undone. Any storage consumed will be released.",
		},
		onClick: async () => {
			await snapshotsManager.deleteSnapshot(snapshot.id, snapshot.isCloud);
			toast.success("Snapshot deleted");
			loadSnapshots();
		},
	});
}

// Restore Snapshot
function promptRestore(snapshot: UnifiedSnapshotItem) {
	restoreTarget = snapshot;
	restoreDialogOpen = true;
}

async function handleRestore() {
	if (!restoreTarget || isRestoring) return;
	isRestoring = true;
	try {
		await snapshotsManager.restoreSnapshot(
			restoreTarget.id,
			restoreTarget.isCloud,
			restoreTarget.noteId,
		);
		toast.success(`Restored "${restoreTarget.noteName}" to snapshot state`);
		restoreDialogOpen = false;
		if (previewOpen) {
			previewOpen = false;
			cleanupPreview();
		}
		loadSnapshots();
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Failed to restore note";
		toast.error(msg);
	} finally {
		isRestoring = false;
	}
}
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <Topbar class="shrink-0" />

  <div
    class="min-h-0 max-h-[calc(100vh-4rem)] flex-1 overflow-y-auto "
  >
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <!-- Header -->
      <header class="flex flex-col gap-4 border-b border-border/40 pb-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
                Version History
              </h1>
              {#if isCloudWorkspace}
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
              Browse, preview, and restore snapshot versions for notes in {workspace?.name ??
                "your workspace"}.
            </p>
          </div>

          <Button
            onclick={() => {
              createNoteId = notes[0]?.id ?? "";
              createDialogOpen = true;
            }}
            disabled={!workspace || notes.length === 0}
          >
            <Plus data-icon="inline-start" />
            Take Snapshot
          </Button>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="flex flex-wrap items-center gap-2.5 pt-2">
          <!-- Search -->
          <div class="relative min-w-48 flex-1">
            <Search
              class="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Search snapshots or notes..."
              bind:value={searchQuery}
              class="h-8 pl-8 text-xs"
            />
          </div>

          <!-- Note Selector -->
          {#if notes.length > 0}
            <Select.Root type="single" bind:value={selectedNoteId}>
              <Select.Trigger
                class="h-8 min-w-36 max-w-56 text-xs"
                aria-label="Filter by note"
              >
                <span class="truncate">{selectedNoteLabel}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.GroupHeading>Notes</Select.GroupHeading>
                  <Select.Item
                    value="all"
                    label={`All Notes (${notes.length})`}
                  >
                    All Notes ({notes.length})
                  </Select.Item>
                  {#each notes as note (note.id)}
                    <Select.Item value={note.id} label={note.name}>
                      <IconsRenderer
                        icon={note.icon ?? "lucide:file-text"}
                        class="text-sm!"
                      />
                      <span class="truncate">{note.name}</span>
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          {/if}

          <!-- Kind Filter -->
          <Select.Root type="single" bind:value={selectedKind}>
            <Select.Trigger
              class="h-8 min-w-32 text-xs"
              aria-label="Filter by snapshot kind"
            >
              <span class="truncate">{selectedKindLabel}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.GroupHeading>Kind</Select.GroupHeading>
                {#each kindOptions as opt (opt.value)}
                  <Select.Item value={opt.value} label={opt.label}>
                    {opt.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>

          <!-- Sort Selector -->
          <Select.Root type="single" bind:value={selectedSort}>
            <Select.Trigger
              class="h-8 min-w-32 text-xs"
              aria-label="Sort snapshots"
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

          <Button
            variant="outline"
            size="icon-xs"
            onclick={() => (sortOrder = sortOrder === "asc" ? "desc" : "asc")}
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            <span class="text-xs font-semibold"
              >{sortOrder === "asc" ? "↑" : "↓"}</span
            >
          </Button>
        </div>
      </header>

      <!-- Snapshots Content -->
      {#if isLoading}
        <div class="flex flex-col gap-3">
          {#each [1, 2, 3, 4, 5] as skeleton (skeleton)}
            <Card.Root class="py-3">
              <Card.Header class="gap-2">
                <Skeleton class="h-4 w-1/3" />
                <Skeleton class="h-3 w-1/2" />
              </Card.Header>
            </Card.Root>
          {/each}
        </div>
      {:else if snapshots.length === 0}
        <Card.Root class="mx-auto w-full max-w-md border-dashed">
          <Card.Header class="text-center">
            <div
              class="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
            >
              <History class="size-6" />
            </div>
            <Card.Title class="text-base font-semibold"
              >No snapshots found</Card.Title
            >
            <Card.Description>
              {#if searchQuery || selectedNoteId !== "all" || selectedKind !== "all"}
                Try adjusting your filters or search terms.
              {:else}
                Snapshots are automatically captured every 10 minutes when notes
                are modified, or you can take a manual snapshot anytime.
              {/if}
            </Card.Description>
          </Card.Header>
          <Card.Content class="flex justify-center">
            <Button
              onclick={() => {
                createNoteId = notes[0]?.id ?? "";
                createDialogOpen = true;
              }}
              disabled={!workspace || notes.length === 0}
            >
              <Plus data-icon="inline-start" />
              Take Snapshot
            </Button>
          </Card.Content>
        </Card.Root>
      {:else}
        <div class="flex flex-col gap-2.5" transition:fade={{ duration: 150 }}>
          {#each snapshots as snapshot (snapshot.id)}
            <Card.Root
              class="group/card border-border/60 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-3 px-4"
              >
                <!-- Note Info & Metadata -->
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover/card:text-foreground"
                  >
                    <IconsRenderer
                      icon={snapshot.noteIcon ?? "lucide:FileText"}
                      class="size-4"
                    />
                  </div>

                  <div class="flex min-w-0 flex-1 flex-col gap-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="truncate text-sm font-semibold text-foreground"
                      >
                        {snapshot.noteName}
                      </span>
                      {#if snapshot.label && snapshot.label !== "Auto Snapshot"}
                        <span class="text-xs text-muted-foreground">
                          • {snapshot.label}
                        </span>
                      {/if}
                    </div>

                    <div
                      class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Badge
                        variant={snapshot.kind === "manual"
                          ? "default"
                          : "secondary"}
                        class="text-[0.65rem] uppercase tracking-wider"
                      >
                        {snapshot.kind}
                      </Badge>

                      <span>{formatBytes(snapshot.size)}</span>
                      <span>•</span>
                      <span>{formatDate(snapshot.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-1">
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon-sm"
                          onclick={() => openPreview(snapshot)}
                        >
                          <Eye class="size-3.5" />
                          <span class="sr-only">Preview snapshot</span>
                        </Button>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content>Preview</Tooltip.Content>
                  </Tooltip.Root>

                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon-sm"
                          onclick={() => promptRestore(snapshot)}
                        >
                          <RotateCcw class="size-3.5" />
                          <span class="sr-only">Restore version</span>
                        </Button>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content>Restore Version</Tooltip.Content>
                  </Tooltip.Root>

                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          variant="destructive"
                          size="icon-sm"
                          onclick={() => confirmDeleteSnapshot(snapshot)}
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

        <!-- Pagination Controls -->
        {#if totalPages > 1}
          <div class="flex items-center justify-between pt-4">
            <span class="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * limit + 1}-{Math.min(
                currentPage * limit,
                totalCount,
              )} of {totalCount} snapshots
            </span>

            <div class="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onclick={() => currentPage--}
              >
                Previous
              </Button>
              <span class="px-2 text-xs font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onclick={() => currentPage++}
              >
                Next
              </Button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Manual Snapshot Creation Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Take Manual Snapshot</Dialog.Title>
      <Dialog.Description>
        Capture an immutable snapshot of a note's current content.
      </Dialog.Description>
    </Dialog.Header>

    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleCreateSnapshot();
      }}
      class="flex flex-col gap-4 py-2"
    >
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-foreground">Note</span>
        <Select.Root type="single" bind:value={createNoteId}>
          <Select.Trigger class="h-9 w-full text-sm" aria-label="Select note">
            <span class="truncate">{createNoteLabel}</span>
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupHeading>Notes</Select.GroupHeading>
              {#each notes as note (note.id)}
                <Select.Item value={note.id} label={note.name}>
                  <IconsRenderer
                    icon={note.icon ?? "lucide:file-text"}
                    class="text-sm!"
                  />
                  <span class="truncate">{note.name}</span>
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      <div class="flex flex-col gap-1.5">
        <label
          for="snapshot-label-input"
          class="text-xs font-medium text-foreground">Label (Optional)</label
        >
        <Input
          id="snapshot-label-input"
          placeholder="e.g. Before major rewrite"
          bind:value={createLabel}
          maxlength={100}
        />
      </div>

      <Dialog.Footer class="pt-2">
        <Dialog.Close class={buttonVariants({ variant: "outline" })}>
          Cancel
        </Dialog.Close>
        <Button type="submit" disabled={!createNoteId || isCreating}>
          {isCreating ? "Saving..." : "Take Snapshot"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Preview Snapshot Dialog -->
<Dialog.Root
  bind:open={previewOpen}
  onOpenChange={(open) => !open && cleanupPreview()}
>
  <Dialog.Content class="sm:max-w-4xl">
    <Dialog.Header>
      <div class="flex flex-wrap items-center gap-4 pr-6">
        <div class="flex items-center gap-2">
          <Dialog.Title class="text-base font-semibold">
            {previewSnapshot?.noteName ?? "Snapshot Preview"}
          </Dialog.Title>
          <Badge variant="secondary" class="text-[0.7rem]">
            {previewSnapshot?.kind}
          </Badge>
        </div>
        {#if previewSnapshot}
          <span class="text-xs text-muted-foreground">
            {formatDate(previewSnapshot.createdAt)} ({formatBytes(
              previewSnapshot.size,
            )})
          </span>
        {/if}
      </div>
      {#if previewSnapshot?.label}
        <Dialog.Description class="text-xs">
          {previewSnapshot.label}
        </Dialog.Description>
      {/if}
    </Dialog.Header>
    <div class="my-2 min-h-60 max-h-[60vh] overflow-y-auto p-2 ">
      {#if previewLoading}
        <div class="flex flex-col items-center justify-center gap-3 py-8">
          <BarSpinner size={32} />
          <h4>Loading Preview...</h4>
        </div>
      {:else if previewEditor}
        <Edra editor={previewEditor}>
          <Edra.Content class="max-w-3xl mx-auto" />
        </Edra>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Restore Confirmation Dialog -->
<Dialog.Root bind:open={restoreDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <RotateCcw class="size-5 text-primary" />
        Restore "{restoreTarget?.noteName}"?
      </Dialog.Title>
      <Dialog.Description>
        You are restoring this note to the snapshot captured on {restoreTarget
          ? formatDate(restoreTarget.createdAt)
          : ""}.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-3 py-2 text-xs">
      <div
        class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300"
      >
        <strong>Notice:</strong> Current note content will be replaced by the selected
        snapshot state.
      </div>

      <div
        class="rounded-lg border border-border/60 bg-muted/40 p-3 text-muted-foreground"
      >
        <strong class="text-foreground">Safety Guarantee:</strong> An automatic restore
        point will be created immediately before restoring, so your current version
        can always be recovered.
      </div>
    </div>

    <Dialog.Footer class="pt-2">
      <Dialog.Close class={buttonVariants({ variant: "outline" })}>
        Cancel
      </Dialog.Close>
      <Button variant="default" disabled={isRestoring} onclick={handleRestore}>
        {isRestoring ? "Restoring..." : "Restore Note"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
