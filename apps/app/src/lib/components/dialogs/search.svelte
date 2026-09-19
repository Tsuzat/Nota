<script lang="ts" module>
let open = $state(false);

export const openSearch = () => {
	open = true;
};

export const closeSearch = () => {
	open = false;
};

export const toggleSearch = () => {
	open = !open;
};
</script>

<script lang="ts">
import Check from "@lucide/svelte/icons/check";
import Cloud from "@lucide/svelte/icons/cloud";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import History from "@lucide/svelte/icons/history";
import Star from "@lucide/svelte/icons/star";
import { BarSpinner, IconsRenderer } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import * as Command from "@nota/ui/shadcn/command/index.js";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import {
	snapshotsManager,
	type UnifiedSnapshotItem,
} from "#lib/data/snapshots.svelte.ts";
import type { NoteMeta, Workspace } from "#lib/data/types.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { formatBytes, formatDate } from "#lib/utils.ts";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

const workspaceCtx = getWorkspaceContext();
const notesCtx = getNotesContext();

const currentWorkspace = $derived(workspaceCtx.current);
const localWorkspaces = $derived(workspaceCtx.local.workspaces);
const cloudWorkspaces = $derived(workspaceCtx.cloud.workspaces);
const activeNotes = $derived(notesCtx.list.filter((n) => !n.trashedAt));

let snapshots = $state<UnifiedSnapshotItem[]>([]);
let isLoadingSnapshots = $state(false);

$effect(() => {
	if (!open) return;
	const currentWs = workspaceCtx.current;
	if (!currentWs) {
		snapshots = [];
		return;
	}
	const isCloud = "ownerId" in currentWs;
	isLoadingSnapshots = true;
	snapshotsManager
		.fetchWorkspaceSnapshots(currentWs.id, isCloud, { limit: 30 })
		.then((res) => {
			snapshots = res.items;
		})
		.catch((err) => {
			console.error("Failed to fetch snapshots for search:", err);
			snapshots = [];
		})
		.finally(() => {
			isLoadingSnapshots = false;
		});
});

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
		e.preventDefault();
		open = !open;
	}
}

const workspaceHref = (workspace: Workspace) =>
	resolve(
		"ownerId" in workspace
			? "/(cloud)/space-[id]"
			: "/(local)/local-workspace-[id]",
		{ id: workspace.id },
	);

const switchWorkspace = (workspace: Workspace) => {
	open = false;
	if (workspaceCtx.current?.id === workspace.id) return;
	workspaceCtx.current = workspace;
	goto(workspaceHref(workspace));
};

const openNote = (note: NoteMeta) => {
	open = false;
	notesCtx.current = note;
	const isCloud = "ownerId" in note;
	const href = resolve(
		isCloud ? "/(cloud)/note-[id]" : "/(local)/local-note-[id]",
		{ id: note.id },
	);
	goto(href);
};

const openSnapshot = (snapshot: UnifiedSnapshotItem) => {
	open = false;
	goto(`${resolve("/versions")}?noteId=${snapshot.noteId}`);
};
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog
  bind:open
  title="Global Search"
  description="Search workspaces, notes, and snapshots"
  class="top-1/2! -translate-y-1/2! sm:max-w-2xl! max-w-2xl! w-full rounded-2xl! border border-border/50 bg-popover/95 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10 dark:ring-white/10 overflow-hidden **:data-[slot=command]:p-0! **:data-[slot=command-input-wrapper]:p-2! **:data-[slot=command-input-wrapper]:border-b! **:data-[slot=command-input-wrapper]:border-border/40! **:data-[slot=input-group]:h-11! **:data-[slot=input-group]:bg-transparent! **:data-[slot=input-group]:border-transparent! **:data-[slot=input-group]:shadow-none! **:data-[slot=input-group]:rounded-none! [&_[data-slot=input-group]_svg]:size-5! [&_[data-slot=input-group]_svg]:opacity-60! **:data-[slot=command-input]:text-[15px]! **:data-[slot=command-input]:placeholder:text-muted-foreground/50!"
>
  <Command.Input placeholder="Search workspaces, notes, snapshots..." />
  <Command.List class="max-h-95 p-2 scroll-py-2 no-scrollbar">
    <Command.Empty class="py-12 text-center text-sm text-muted-foreground">
      <div class="flex flex-col items-center justify-center gap-1.5">
        <span class="font-medium text-foreground/80">No results found</span>
        <span class="text-xs text-muted-foreground/70">
          Try searching for a different workspace, note, or snapshot
        </span>
      </div>
    </Command.Empty>

    {#if localWorkspaces.length > 0 || cloudWorkspaces.length > 0}
      <Command.Group
        heading="Workspaces"
        class="px-1 py-1 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-muted-foreground/70"
      >
        {#each localWorkspaces as ws (ws.id)}
          <Command.Item
            value={`${ws.name} ${ws.id} local workspace`}
            onSelect={() => switchWorkspace(ws)}
            class="h-11 px-3 py-2 my-0.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="size-7 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0">
                <IconsRenderer icon={ws.icon || "lucide:Folder"} class="size-4" />
              </div>
              <span class="truncate font-medium text-sm text-foreground">{ws.name}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Badge variant="outline" class="text-[10px] px-2 py-0.5 h-4.5 font-normal rounded-full bg-muted/40 border-border/50 text-muted-foreground">
                <HardDrive class="size-2.5 mr-1 inline" /> Local
              </Badge>
              {#if ws.id === currentWorkspace?.id}
                <span class="flex items-center gap-1 text-[11px] text-muted-foreground pl-1">
                  <Check class="size-3.5 text-primary shrink-0" />
                  <span class="hidden sm:inline">Active</span>
                </span>
              {/if}
            </div>
          </Command.Item>
        {/each}

        {#each cloudWorkspaces as ws (ws.id)}
          <Command.Item
            value={`${ws.name} ${ws.id} cloud workspace`}
            onSelect={() => switchWorkspace(ws)}
            class="h-11 px-3 py-2 my-0.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="size-7 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0">
                <IconsRenderer icon={ws.icon || "lucide:Folder"} class="size-4" />
              </div>
              <span class="truncate font-medium text-sm text-foreground">{ws.name}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Badge variant="outline" class="text-[10px] px-2 py-0.5 h-4.5 font-normal rounded-full bg-muted/40 border-border/50 text-muted-foreground">
                <Cloud class="size-2.5 mr-1 inline" /> Cloud
              </Badge>
              {#if ws.id === currentWorkspace?.id}
                <span class="flex items-center gap-1 text-[11px] text-muted-foreground pl-1">
                  <Check class="size-3.5 text-primary shrink-0" />
                  <span class="hidden sm:inline">Active</span>
                </span>
              {/if}
            </div>
          </Command.Item>
        {/each}
      </Command.Group>
      <Command.Separator class="my-1.5 mx-2 bg-border/40" />
    {/if}

    {#if activeNotes.length > 0}
      <Command.Group
        heading={`Notes • ${currentWorkspace?.name ?? "Current Workspace"}`}
        class="px-1 py-1 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-muted-foreground/70"
      >
        {#each activeNotes as note (note.id)}
          <Command.Item
            value={`${note.name} ${note.description ?? ""} note ${note.id}`}
            onSelect={() => openNote(note)}
            class="h-11 px-3 py-2 my-0.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="size-7 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0">
                <IconsRenderer icon={note.icon || "lucide:FileText"} class="size-4" />
              </div>
              <span class="truncate font-medium text-sm text-foreground">{note.name || "Untitled Note"}</span>
              {#if note.starred}
                <Star class="size-3 text-amber-500 fill-amber-500 shrink-0 ml-0.5" />
              {/if}
            </div>
            {#if note.updatedAt || note.createdAt}
              <span class="text-xs text-muted-foreground/70 shrink-0 tabular-nums">
                {formatDate(note.updatedAt || note.createdAt)}
              </span>
            {/if}
          </Command.Item>
        {/each}
      </Command.Group>
      <Command.Separator class="my-1.5 mx-2 bg-border/40" />
    {/if}

    {#if isLoadingSnapshots}
      <Command.Loading class="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
        <BarSpinner size={14} />
        <span>Loading snapshots...</span>
      </Command.Loading>
    {/if}

    {#if snapshots.length > 0}
      <Command.Group
        heading="Snapshots"
        class="px-1 py-1 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-muted-foreground/70"
      >
        {#each snapshots as snap (snap.id)}
          <Command.Item
            value={`${snap.label ?? ""} ${snap.noteName} snapshot ${snap.kind} ${snap.id}`}
            onSelect={() => openSnapshot(snap)}
            class="h-11 px-3 py-2 my-0.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="size-7 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0">
                <History class="size-4 text-muted-foreground" />
              </div>
              <div class="flex flex-col min-w-0 flex-1 leading-tight">
                <span class="truncate font-medium text-xs text-foreground">
                  {snap.label || "Snapshot"}
                </span>
                <span class="text-[11px] text-muted-foreground/70 truncate">
                  in {snap.noteName} • {formatBytes(snap.size)}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" class="text-[9px] px-1.5 py-0 h-4 uppercase font-medium rounded-full bg-muted/60 text-muted-foreground">
                {snap.kind}
              </Badge>
              <span class="text-xs text-muted-foreground/70 tabular-nums">
                {formatDate(snap.createdAt)}
              </span>
            </div>
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>

  <div class="flex items-center justify-between border-t border-border/40 bg-muted/30 px-4 py-2 text-xs text-muted-foreground select-none rounded-b-2xl">
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 font-medium text-foreground/70">
        <span class="size-1.5 rounded-full bg-emerald-500 inline-block"></span>
        <span class="text-[11px]">Nota</span>
      </div>
      {#if currentWorkspace}
        <span class="text-muted-foreground/40 text-[10px]">•</span>
        <span class="text-[11px] text-muted-foreground truncate max-w-35 sm:max-w-50">
          {currentWorkspace.name}
        </span>
      {/if}
    </div>

    <div class="flex items-center gap-3 text-[11px]">
      <span class="flex items-center gap-1.5">
        <span class="text-muted-foreground/80">Navigate</span>
        <div class="flex items-center gap-0.5">
          <kbd class="inline-flex items-center justify-center size-4.5 rounded border border-border/70 bg-background/80 font-mono text-[10px] text-muted-foreground shadow-2xs">↑</kbd>
          <kbd class="inline-flex items-center justify-center size-4.5 rounded border border-border/70 bg-background/80 font-mono text-[10px] text-muted-foreground shadow-2xs">↓</kbd>
        </div>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="text-muted-foreground/80">Open</span>
        <kbd class="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded border border-border/70 bg-background/80 font-mono text-[10px] text-muted-foreground shadow-2xs">↵</kbd>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="text-muted-foreground/80">Close</span>
        <kbd class="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded border border-border/70 bg-background/80 font-mono text-[10px] text-muted-foreground shadow-2xs">esc</kbd>
      </span>
    </div>
  </div>
</Command.Dialog>

