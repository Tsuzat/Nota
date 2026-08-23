<script lang="ts" module>
import type { NoteMeta } from "#lib/data/types.ts";

let open = $state(false);
let note = $state<NoteMeta | null>(null);

export const openNoteMove = (target: NoteMeta) => {
	note = target;
	open = true;
};
</script>

<script lang="ts">
import ArrowRight from "@lucide/svelte/icons/arrow-right";
import Check from "@lucide/svelte/icons/check";
import ChevronRight from "@lucide/svelte/icons/chevron-right";
import Cloud from "@lucide/svelte/icons/cloud";
import CornerUpLeft from "@lucide/svelte/icons/corner-up-left";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import Search from "@lucide/svelte/icons/search";
import { toast } from "@nota/ui";
import { BarSpinner, IconsRenderer } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.ts";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@nota/ui/shadcn/dialog/index.ts";
import { Input } from "@nota/ui/shadcn/input/index.js";
import { cn } from "@nota/ui/utils";
import { fetchNotesByWorkspace } from "@nota/db-local/data/notes";
import { SvelteSet } from "svelte/reactivity";
import { fly, slide } from "svelte/transition";
import { orpc, queryClient } from "#lib/orpc.js";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import {
	buildAncestorChain,
	buildChildrenMap,
	getDescendants,
} from "#lib/data/move-notes.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";

const notesCtx = getNotesContext();
const workspaceCtx = getWorkspaceContext();

interface DestNode {
	id: string;
	name: string;
	icon: string | null;
	parentNoteId: string | null;
}

let step = $state<1 | 2>(1);
let targetWorkspaceId = $state<string | null>(null);
let destinationNotes = $state<NoteMeta[] | null>(null);
let loadingDest = $state(false);
let selectedParentId = $state<string | null>(null);
let moveChildren = $state(true);
let search = $state("");
const expanded = new SvelteSet<string>();
let isMoving = $state(false);

$effect(() => {
	if (open) {
		step = 1;
		targetWorkspaceId = null;
		destinationNotes = null;
		loadingDest = false;
		selectedParentId = null;
		moveChildren = true;
		search = "";
		expanded.clear();
		isMoving = false;
	}
});

const isCloudNote = $derived(note !== null && "ownerId" in note);

const candidateWorkspaces = $derived(
	note === null
		? []
		: isCloudNote
			? workspaceCtx.cloud.workspaces
			: workspaceCtx.local.workspaces,
);

// ── Source workspace tree ────────────────────────────────────────────
const subtreeIds = $derived.by(() => {
	if (!note) return new SvelteSet<string>();
	const ids = new SvelteSet<string>([note.id]);
	for (const d of getDescendants(note.id, notesCtx.list)) ids.add(d.id);
	return ids;
});

const nestedCount = $derived(Math.max(0, subtreeIds.size - 1));

const directChildrenCount = $derived.by(() => {
	if (!note) return 0;
	return (buildChildrenMap(notesCtx.list).get(note.id) ?? []).length;
});

const sourceWorkspace = $derived(
	note
		? (workspaceCtx.all.find((w) => w.id === note?.workspaceId) ?? null)
		: null,
);

const beforeNames = $derived.by(() => {
	if (!note) return [];
	const chain = buildAncestorChain(note.id, notesCtx.list).map((ref) => {
		const meta = notesCtx.list.find((n) => n.id === ref.id);
		return meta?.name ?? "";
	});
	return [
		sourceWorkspace?.name ?? "Workspace",
		...chain.slice(0, -1),
		note.name,
	];
});

// ── Destination tree ─────────────────────────────────────────────────
const targetWorkspace = $derived(
	targetWorkspaceId
		? (workspaceCtx.all.find((w) => w.id === targetWorkspaceId) ?? null)
		: null,
);

const destNodes = $derived.by(() => {
	if (!destinationNotes) return [];
	return destinationNotes
		.filter((n) => !n.trashedAt && !subtreeIds.has(n.id))
		.map(
			(n): DestNode => ({
				id: n.id,
				name: n.name,
				icon: n.icon ?? null,
				parentNoteId: n.parentNoteId,
			}),
		);
});

const destById = $derived(new Map(destNodes.map((n) => [n.id, n])));

function childrenOfDest(id: string | null): DestNode[] {
	return destNodes.filter((n) =>
		id === null ? !n.parentNoteId || !destById.has(n.parentNoteId) : n.parentNoteId === id,
	);
}

const destRoots = $derived(childrenOfDest(null));

const searchResults = $derived.by(() => {
	const q = search.trim().toLowerCase();
	if (!q) return null;
	return destNodes.filter((n) => n.name.toLowerCase().includes(q));
});

const afterParents = $derived.by(() => {
	if (!targetWorkspaceId) return [];
	if (!selectedParentId) return [];
	const chain = buildAncestorChain(
		selectedParentId,
		destinationNotes ?? [],
	).slice(0, -1);
	const names = chain.map(
		(ref) => destById.get(ref.id)?.name ?? "",
	);
	return names;
});

const promotedCount = $derived(
	moveChildren ? 0 : directChildrenCount,
);

// ── Actions ──────────────────────────────────────────────────────────
async function pickWorkspace(workspaceId: string) {
	if (!note || isMoving) return;
	step = 2;
	targetWorkspaceId = workspaceId;
	destinationNotes = null;
	selectedParentId = null;
	search = "";
	loadingDest = true;
	try {
		if (isCloudNote) {
			const rows = await queryClient.fetchQuery(
				orpc.notes.listByWorkspace.queryOptions({
					input: { workspaceId },
				}),
			);
			destinationNotes = rows ?? [];
		} else {
			destinationNotes = await fetchNotesByWorkspace(workspaceId);
		}
	} catch {
		destinationNotes = [];
		toast.error("Failed to load destination notes");
	} finally {
		loadingDest = false;
	}
}

function toggleExpand(id: string) {
	if (expanded.has(id)) expanded.delete(id);
	else expanded.add(id);
}

async function handleMove() {
	if (!note || !targetWorkspaceId || loadingDest || isMoving) return;
	isMoving = true;
	try {
		await notesCtx.move({
			note,
			targetWorkspaceId,
			targetParentId: selectedParentId,
			moveChildren,
		});
		toast.success(`Moved “${note.name}”`);
		open = false;
	} catch (e) {
		toast.error(
			e instanceof Error ? e.message : "Failed to move note",
		);
	} finally {
		isMoving = false;
	}
}
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only">Open</DialogTrigger>
  <DialogContent class="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        Move note
        {#if note}
          <span
            class="flex min-w-0 items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground"
          >
            <IconsRenderer icon={note.icon ?? "lucide:FileText"} />
            <span class="max-w-40 truncate">{note.name}</span>
          </span>
        {/if}
      </DialogTitle>
      <DialogDescription>
        {isCloudNote
          ? "Move this note to another cloud workspace or re-organize it."
          : "Move this note to another local workspace or re-organize it."}
      </DialogDescription>
    </DialogHeader>

    {#if note}
      <!-- Step indicator -->
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          class={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5",
            step === 1 && "bg-primary text-primary-foreground",
            step === 2 && "bg-muted",
          )}
        >
          1 · Workspace
        </span>
        <ArrowRight class="size-3" />
        <span
          class={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5",
            step === 2 && "bg-primary text-primary-foreground",
            step === 1 && "bg-muted",
          )}
        >
          2 · Location
        </span>
      </div>

      {#key step}
        <div in:fly={{ y: 10, duration: 160 }}>
          {#if step === 1}
            <!-- Step 1: destination workspace -->
            <div class="max-h-72 space-y-2 overflow-y-auto pr-1">
              {#if candidateWorkspaces.length === 0}
                <p class="py-8 text-center text-sm text-muted-foreground">
                  No {isCloudNote ? "cloud" : "local"} workspaces available.
                </p>
              {/if}
              {#each candidateWorkspaces as ws, i (ws.id)}
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  in:fly={{ y: 6, duration: 150, delay: i * 40 }}
                  onclick={() => pickWorkspace(ws.id)}
                >
                  <IconsRenderer
                    icon={ws.icon ?? "lucide:Folder"}
                    class="text-lg"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">
                      {ws.name}
                    </div>
                    <div class="text-muted-foreground text-xs">
                      {workspaceCtx.current?.id === ws.id
                        ? "Current workspace"
                        : "Workspace"}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {#if "ownerId" in ws}
                      <Cloud />
                      Cloud
                    {:else}
                      <HardDrive />
                      Local
                    {/if}
                  </Badge>
                </button>
              {/each}
            </div>
          {:else}
            <!-- Step 2: location inside destination -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onclick={() => (step = 1)}
                >
                  <CornerUpLeft />
                </Button>
                <div class="flex min-w-0 items-center gap-1.5 text-sm">
                  <IconsRenderer
                    icon={targetWorkspace?.icon ?? "lucide:Folder"}
                  />
                  <span class="truncate font-medium">
                    {targetWorkspace?.name ?? ""}
                  </span>
                </div>
                <div class="relative ml-auto">
                  <Search
                    class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                  />
                  <Input
                    class="h-8 w-44 pl-8"
                    placeholder="Search notes…"
                    bind:value={search}
                  />
                </div>
              </div>

              <div class="max-h-56 space-y-0.5 overflow-y-auto rounded-lg border p-1.5">
                {#if loadingDest}
                  <div
                    class="flex flex-col items-center justify-center gap-2 py-8"
                  >
                    <BarSpinner size={20} />
                    <p class="text-muted-foreground text-xs animate-pulse">
                      Loading notes…
                    </p>
                  </div>
                {:else if searchResults !== null}
                  {#if searchResults.length === 0}
                    <p
                      class="py-6 text-center text-muted-foreground text-xs"
                    >
                      No matching notes
                    </p>
                  {/if}
                  {#each searchResults as node (node.id)}
                    <button
                      type="button"
                      class={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60",
                        selectedParentId === node.id && "bg-primary/10",
                      )}
                      onclick={() => (selectedParentId = node.id)}
                    >
                      <IconsRenderer
                        icon={node.icon ?? "lucide:FileText"}
                      />
                      <span class="min-w-0 flex-1 truncate">
                        {node.name}
                      </span>
                      {#if selectedParentId === node.id}
                        <Check class="text-primary size-4" />
                      {/if}
                    </button>
                  {/each}
                {:else}
                  <!-- Top level option -->
                  <button
                    type="button"
                    class={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60",
                      selectedParentId === null && "bg-primary/10",
                    )}
                    onclick={() => (selectedParentId = null)}
                  >
                    <CornerUpLeft
                      class="text-muted-foreground size-4"
                    />
                    <span class="min-w-0 flex-1 truncate font-medium">
                      Top level
                    </span>
                    {#if selectedParentId === null}
                      <Check class="text-primary size-4" />
                    {/if}
                  </button>
                  {#each destRoots as root (root.id)}
                    {@render destNodeRow(root, 1)}
                  {/each}
                  {#if destRoots.length === 0}
                    <p
                      class="py-6 text-center text-muted-foreground text-xs"
                    >
                      This workspace has no notes yet
                    </p>
                  {/if}
                {/if}
              </div>

              {#if nestedCount > 0}
                <div transition:slide class="space-y-1.5">
                  <p class="text-muted-foreground text-xs">
                    This note has {nestedCount}
                    {nestedCount === 1 ? "nested note" : "nested notes"}
                  </p>
                  <button
                    type="button"
                    class="flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50"
                    class:border-primary={moveChildren}
                    onclick={() => (moveChildren = true)}
                  >
                    <span
                      class={cn(
                        "mt-0.5 flex size-4 items-center justify-center rounded-full border",
                        moveChildren
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {#if moveChildren}
                        <Check
                          class="text-primary-foreground size-3"
                        />
                      {/if}
                    </span>
                    <span class="text-sm">
                      Move them along
                      <span class="text-muted-foreground block text-xs">
                        The whole branch stays together
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    class="flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50"
                    class:border-primary={!moveChildren}
                    onclick={() => (moveChildren = false)}
                  >
                    <span
                      class={cn(
                        "mt-0.5 flex size-4 items-center justify-center rounded-full border",
                        !moveChildren
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {#if !moveChildren}
                        <Check
                          class="text-primary-foreground size-3"
                        />
                      {/if}
                    </span>
                    <span class="text-sm">
                      Leave them here
                      <span class="text-muted-foreground block text-xs">
                        {directChildrenCount}
                        {directChildrenCount === 1 ? "note moves" : "notes move"}
                        to the top level of this workspace
                      </span>
                    </span>
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/key}

      <!-- Before / After preview -->
      <Card.Root
        class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-muted/30 py-3"
      >
        <div class="min-w-0 space-y-1 px-3">
          <p class="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            Before
          </p>
          {@render crumbs(beforeNames)}
        </div>
        <ArrowRight class="text-muted-foreground size-4 shrink-0" />
        <div class="min-w-0 space-y-1 px-3">
          <p class="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            After
          </p>
          {#if targetWorkspaceId}
            {@render crumbs([targetWorkspace?.name ?? "", ...afterParents, note.name])}
            <p class="text-muted-foreground truncate text-[11px]">
              {#if nestedCount === 0}
                No nested notes
              {:else if moveChildren}
                {nestedCount}
                {nestedCount === 1 ? "note" : "notes"}
                moving along
              {:else}
                {promotedCount}
                {promotedCount === 1 ? "note" : "notes"}
                to top level
              {/if}
            </p>
          {:else}
            <p class="text-muted-foreground text-[11px] italic">
              Select a destination…
            </p>
          {/if}
        </div>
      </Card.Root>

      <DialogFooter class="sm:justify-between">
        <span class="text-muted-foreground hidden text-xs sm:inline-block">
          {#if step === 2}
            {selectedParentId === null
              ? "Moving to top level"
              : `Under “${destById.get(selectedParentId)?.name ?? ""}”`}
          {/if}
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            onclick={() => (open = false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onclick={handleMove}
            disabled={!targetWorkspaceId || loadingDest || isMoving}
          >
            {#if isMoving}
              <BarSpinner class="mr-1.5 size-4" />
              Moving…
            {:else}
              Move
            {/if}
          </Button>
        </div>
      </DialogFooter>
    {/if}
  </DialogContent>
</Dialog>

{#snippet destNodeRow(node: DestNode, depth: number)}
  <div>
    <div
      class="group flex items-center gap-1"
      style={`padding-left: ${(depth - 1) * 14}px`}
    >
      {#if childrenOfDest(node.id).length > 0}
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded transition-transform"
          class:rotate-90={expanded.has(node.id)}
          onclick={() => toggleExpand(node.id)}
        >
          <ChevronRight class="size-3.5" />
        </button>
      {:else}
        <span class="size-5 shrink-0"></span>
      {/if}
      <button
        type="button"
        class={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-muted/60",
          selectedParentId === node.id && "bg-primary/10",
        )}
        onclick={() => (selectedParentId = node.id)}
      >
        <IconsRenderer icon={node.icon ?? "lucide:FileText"} />
        <span class="min-w-0 flex-1 truncate">{node.name}</span>
        {#if selectedParentId === node.id}
          <Check class="text-primary size-4" />
        {/if}
      </button>
    </div>
    {#if childrenOfDest(node.id).length > 0 && expanded.has(node.id)}
      <div in:fly={{ y: 4, duration: 120 }}>
        {#each childrenOfDest(node.id) as child (child.id)}
          {@render destNodeRow(child, depth + 1)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet crumbs(names: string[])}
  <div class="flex min-w-0 flex-wrap items-center gap-0.5">
    {#each names as name, i (i)}
      {#if i > 0}
        <ChevronRight class="text-muted-foreground/60 size-3 shrink-0" />
      {/if}
      <span
        class="max-w-24 truncate rounded border bg-background px-1.5 py-0.5 text-[11px]"
        class:font-medium={i === names.length - 1}
      >
        {name}
      </span>
    {/each}
  </div>
{/snippet}
