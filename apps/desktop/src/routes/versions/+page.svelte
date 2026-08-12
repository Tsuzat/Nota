<script lang="ts">
  import { IconRenderer, icons } from "@lib/icons";
  import BarSpinner from "@lib/icons/moving-icons/bar-spinner.svelte";
  import {
    getAuthContext,
    getNotesContext,
    getVersionsContext,
    type Note,
    type NoteVersion,
  } from "@nota/client";
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { type Content, createEditor, Edra } from "@nota/ui/edra/index.js";
  import { Badge } from "@nota/ui/shadcn/badge";
  import { Button } from "@nota/ui/shadcn/button";
  import { Card, CardContent } from "@nota/ui/shadcn/card";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@nota/ui/shadcn/dialog";
  import { Input } from "@nota/ui/shadcn/input";
  import * as Select from "@nota/ui/shadcn/select";
  import { toast } from "@nota/ui/shadcn/sonner";
  import * as Tabs from "@nota/ui/shadcn/tabs";
  import { page as appPage } from "$app/state";
  import Topbar from "$lib/components/topbar.svelte";
  import { getCurrentWorkspace } from "$lib/currentworkspace.svelte";
  import { getLocalNotes } from "$lib/local/notes.svelte";
  import { getLocalVersions } from "$lib/local/versions.svelte";

  // --- Contexts ---
  const authContext = getAuthContext();
  const versionsCtx = getVersionsContext();
  const localVersionsCtx = getLocalVersions();
  const cloudNotes = getNotesContext();
  const localNotes = getLocalNotes();

  // --- Derived state ---
  const isPro = $derived(authContext.user?.subscription_plan === "pro");
  const currentWorkspace = $derived(getCurrentWorkspace().get());
  const isLocal = $derived(
    currentWorkspace ? !("owner" in currentWorkspace) : false,
  );

  // --- View source: "local" or "cloud" ---
  let viewSource = $state<"local" | "cloud">("cloud");

  // --- Filter state ---
  let versions = $state<NoteVersion[]>([]);
  let total = $state(0);
  let page = $state(1);
  let loading = $state(true);
  let searchInput = $state(appPage.url.searchParams.get("search") || "");
  let search = $state(appPage.url.searchParams.get("search") || "");
  let typeFilter = $state<string>(appPage.url.searchParams.get("type") || "");
  let selectedNoteId = $state<string>(
    appPage.url.searchParams.get("note_ids") || "",
  );

  // --- O(1) note lookup map ---
  const noteMap = $derived.by(() => {
    const notes = isLocal
      ? localNotes
          .getNotes()
          .filter((n) => n.workspace_id === currentWorkspace?.id)
      : cloudNotes.notes.filter((n) => n.workspace_id === currentWorkspace?.id);
    return new Map(notes.map((n) => [n.id, n]));
  });

  // --- Unified versions provider ---
  const versionsProvider = $derived.by(() => {
    if (viewSource === "local") {
      return {
        list: (wsId: string, filters: any) =>
          localVersionsCtx.listWorkspaceVersions(wsId, filters),
        getContent: (noteId: string, vId: string) =>
          localVersionsCtx.getVersionContent(noteId, vId),
        deleteVersion: (noteId: string, vId: string) =>
          localVersionsCtx.deleteVersion(noteId, vId),
      };
    }
    return {
      list: (wsId: string, filters: any) =>
        versionsCtx.listWorkspaceVersions(wsId, filters),
      getContent: (noteId: string, vId: string) =>
        versionsCtx.getVersionContent(noteId, vId),
      deleteVersion: (noteId: string, vId: string) =>
        versionsCtx.deleteVersion(noteId, vId),
    };
  });

  // Can restore from this view?
  // - Local workspace: no (restore happens in the note editor)
  // - Cloud workspace + cloud tab: yes (backend has the version)
  // - Cloud workspace + local tab: yes (send content to backend)
  const canRestore = $derived(!isLocal);

  // --- Preview state ---
  let previewOpen = $state(false);
  let previewLoading = $state(false);
  let previewVersion = $state<NoteVersion | null>(null);
  let previewContent = $state<Content | null>(null);
  let restoringId = $state<string | null>(null);

  const previewEditor = createEditor();

  $effect(() => {
    if (previewEditor && previewContent) {
      previewEditor.commands.setContent(previewContent, {
        contentType: "json",
      });
      previewEditor.setEditable(false);
    }
  });

  // --- Data loading ---
  async function loadVersions() {
    const ws = currentWorkspace;
    if (!ws) return;
    loading = true;
    try {
      const filters = {
        page,
        limit: 20,
        search,
        type: typeFilter,
        note_ids: selectedNoteId,
      };
      const res = await versionsProvider.list(ws.id, filters);
      versions = res.versions;
      total = res.total;
    } catch (e: any) {
      toast.error(e.message || "Failed to load versions");
    } finally {
      loading = false;
    }
  }

  // Effect 1: When workspace changes, reset everything
  $effect(() => {
    if (currentWorkspace) {
      viewSource = isLocal || !isPro ? "local" : "cloud";
      searchInput = "";
      search = "";
      typeFilter = "";
      selectedNoteId = "";
      page = 1;
    }
  });

  // Effect 2: When any filter/source changes, reload data
  $effect(() => {
    loadVersions();
  });

  // Effect 3: Debounced search — searchInput → search after 300ms
  $effect(() => {
    const val = searchInput;
    const timer = setTimeout(() => {
      if (search !== val) {
        search = val;
        page = 1;
      }
    }, 300);
    return () => clearTimeout(timer);
  });

  const contentToRestoreUpdate = async (content: Content): Promise<string> => {
    const { TiptapTransformer } = await import("@hocuspocus/transformer");
    const { encodeStateAsUpdate } = await import("yjs");

    const ydoc = TiptapTransformer.toYdoc(
      content,
      "default",
      previewEditor?.extensionManager.extensions,
    );
    const update = encodeStateAsUpdate(ydoc);

    let binary = "";
    for (let offset = 0; offset < update.length; offset += 0x8000) {
      binary += String.fromCharCode(...update.subarray(offset, offset + 0x8000));
    }
    const base64 = btoa(binary);
    ydoc.destroy();
    return base64;
  };

  // --- Actions ---
  async function openPreview(v: NoteVersion) {
    try {
      previewOpen = true;
      previewLoading = true;
      previewContent = await versionsProvider.getContent(v.note_id, v.id);
      previewVersion = v;
    } catch (e: any) {
      toast.error(e.message || "Failed to load content");
    } finally {
      previewLoading = false;
    }
  }

  async function restoreVersion(v: NoteVersion) {
    if (
      !confirm(
        "Are you sure you want to restore this version? The current state will be saved as a restore point.",
      )
    )
      return;
    restoringId = v.id;
    try {
      console.log(
        `[restore] Initiating restore for noteId=${v.note_id}, versionId=${v.id}`,
      );

      if (viewSource === "local" && !isLocal) {
        // Cloud note + local snapshot → decompress locally, send content to backend
        const content = await localVersionsCtx.getVersionContent(
          v.note_id,
          v.id,
        );
        const restoreUpdate = await contentToRestoreUpdate(content);
        await versionsCtx.restoreFromContent(
          v.note_id,
          content,
          "Restored from local snapshot",
          restoreUpdate,
        );
      } else if (viewSource === "cloud") {
        // Cloud note + cloud snapshot → existing backend endpoint
        const content = await versionsCtx.getVersionContent(v.note_id, v.id);
        const restoreUpdate = await contentToRestoreUpdate(content);
        await versionsCtx.restoreVersion(v.note_id, v.id, restoreUpdate);
      }
      console.log(`[restore] Restore completed for noteId=${v.note_id}`);
      toast.success("Version restored successfully");
      loadVersions();
    } catch (e: any) {
      toast.error(e.message || "Failed to restore version");
    } finally {
      restoringId = null;
    }
  }

  async function deleteVersion(v: NoteVersion) {
    if (!confirm("Are you sure you want to delete this snapshot?")) return;
    try {
      await versionsProvider.deleteVersion(v.note_id, v.id);
      toast.success("Version deleted");
      loadVersions();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete version");
    }
  }

  // --- Utilities ---
  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function getEmptyStateMessage(): string {
    if (isLocal) {
      return "No local snapshots found. Snapshots are created automatically as you edit your notes.";
    }
    if (viewSource === "local") {
      return "No local snapshots for this cloud workspace.";
    }
    return "No cloud snapshots found. Cloud snapshots are created automatically as you type.";
  }
</script>

<svelte:head>
  <title>Version History - Nota</title>
</svelte:head>

<div class="flex size-full min-h-0 flex-col overflow-hidden">
  <Topbar showSeparator={true}>
    {#snippet left()}
      <span class="font-semibold"> Version History </span>
    {/snippet}
  </Topbar>

  <div class="min-h-0 flex-1 grow overflow-y-auto p-6 md:p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      <div>
        <p class="text-muted-foreground">
          View and restore previous states of your notes.
        </p>
      </div>

      {#if !isLocal && !isPro}
        <div
          class="bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md p-4 flex items-start gap-3"
        >
          <icons.Info class="size-5 mt-0.5 shrink-0" />
          <div class="text-sm">
            <p class="font-medium">Showing Local Snapshots</p>
            <p class="mt-1 opacity-90">
              As a free user, cloud snapshots are disabled. You are viewing
              local snapshots for this cloud workspace.
            </p>
          </div>
        </div>
      {/if}

      {#if !isLocal && isPro}
        <Tabs.Root
          value={viewSource}
          onValueChange={(v) => {
            if (!v) return;
            viewSource = v as "cloud" | "local";
            page = 1;
            loadVersions();
          }}
        >
          <Tabs.List class="grid grid-cols-2">
            <Tabs.Trigger value="cloud">Cloud Snapshots</Tabs.Trigger>
            <Tabs.Trigger value="local">Local Snapshots</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      {/if}

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-48">
          <Input
            placeholder="Search by label..."
            value={searchInput}
            oninput={(e) => {
              searchInput = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
        <Select.Root
          type="single"
          bind:value={selectedNoteId}
          onValueChange={() => {
            page = 1;
          }}
        >
          <Select.Trigger class="w-50">
            {#if selectedNoteId}
              {noteMap.get(selectedNoteId)?.name || "All Notes"}
            {:else}
              All Notes
            {/if}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupHeading>Select Notes</Select.GroupHeading>
              <Select.Item value="">All Notes</Select.Item>
              {#each [...noteMap.values()] as note (note.id)}
                <Select.Item value={note.id}>
                  <span class="flex items-center gap-2">
                    <IconRenderer icon={note.icon} />
                    <span class="truncate">{note.name}</span>
                  </span>
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <Select.Root
          type="single"
          bind:value={typeFilter}
          onValueChange={() => {
            page = 1;
          }}
        >
          <Select.Trigger class="w-38">
            {#if typeFilter === "auto"}
              Auto
            {:else if typeFilter === "manual"}
              Manual
            {:else if typeFilter === "restore"}
              Restore Point
            {:else}
              All Types
            {/if}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupHeading>Version Types</Select.GroupHeading>
              <Select.Item value="">All Types</Select.Item>
              <Select.Item value="auto">Auto</Select.Item>
              <Select.Item value="manual">Pinned</Select.Item>
              <Select.Item value="restore">Restore Point</Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      {#if loading}
        <div class="flex justify-center p-12">
          <BarSpinner size={20} />
        </div>
      {:else if versions.length === 0}
        <Card class="border-dashed">
          <CardContent
            class="flex flex-col items-center justify-center p-12 text-center"
          >
            <icons.Clock />
            <h3 class="text-lg font-medium">No versions found</h3>
            <p class="text-muted-foreground mt-2 max-w-sm">
              {getEmptyStateMessage()}
            </p>
          </CardContent>
        </Card>
      {:else}
        <div class="grid gap-4">
          {#each versions as v (v.id)}
            <Card>
              <CardContent
                class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div class="flex items-start gap-3">
                  <div class="mt-1">
                    {#if v.version_type === "auto"}
                      <icons.Clock class="size-5 text-muted-foreground" />
                    {:else if v.version_type === "restore"}
                      <icons.Undo2 class="size-5 text-blue-500" />
                    {:else}
                      <icons.Pin class="size-5 text-orange-500" />
                    {/if}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium"
                        >{noteMap.get(v.note_id)?.name || "Unknown Note"}</span
                      >
                      <Badge
                        variant={v.version_type === "auto"
                          ? "secondary"
                          : "default"}
                      >
                        {v.version_type}
                      </Badge>
                    </div>
                    <div
                      class="text-sm text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <span>{new Date(v.created_at).toLocaleString()}</span>
                      <span class="hidden sm:inline">•</span>
                      <span>{formatSize(v.size_bytes)}</span>
                      {#if v.label}
                        <span class="hidden sm:inline">•</span>
                        <span class="italic text-foreground">"{v.label}"</span>
                      {/if}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    class="flex-1 sm:flex-none"
                    onclick={() => openPreview(v)}
                  >
                    Preview
                  </Button>
                  {#if canRestore}
                    <Button
                      variant="secondary"
                      size="sm"
                      class="flex-1 sm:flex-none"
                      disabled={restoringId !== null}
                      onclick={() => restoreVersion(v)}
                    >
                      {#if restoringId === v.id}
                        <BarSpinner class="mr-2" size={14} />
                      {/if}
                      {restoringId === v.id ? "Restoring..." : "Restore"}
                    </Button>
                  {:else}
                    <SimpleToolTip
                      content="Restore is available in the note editor"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        class="flex-1 sm:flex-none"
                        disabled
                      >
                        Restore
                      </Button>
                    </SimpleToolTip>
                  {/if}
                  {#if noteMap.get(v.note_id)?.owner === authContext.user?.id}
                    <Button
                      variant="destructive"
                      size="sm"
                      onclick={() => deleteVersion(v)}
                    >
                      <icons.Trash2 />
                    </Button>
                  {/if}
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>

        <div class="flex justify-between items-center pt-4">
          <p class="text-sm text-muted-foreground">
            Showing {versions.length} of {total}
          </p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onclick={() => {
                page--;
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={versions.length < 20}
              onclick={() => {
                page++;
              }}
            >
              Next
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<Dialog bind:open={previewOpen}>
  <DialogContent
    class="min-w-[90vw] h-[80vh] flex flex-col p-0 overflow-hidden"
  >
    <DialogHeader class="p-6 pb-2">
      <DialogTitle class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          Preview: {previewVersion?.label || previewVersion?.version_type}
          {#if previewVersion}
            <Badge
              variant={previewVersion.version_type === "auto"
                ? "secondary"
                : "default"}
            >
              {previewVersion.version_type}
            </Badge>
          {/if}
        </span>
      </DialogTitle>
    </DialogHeader>

    <div class="flex-1 overflow-y-auto relative bg-background/50">
      {#if previewLoading}
        <div
          class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
        >
          <div
            class="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300"
          >
            <BarSpinner size={32} />
            <p class="text-sm text-muted-foreground font-medium tracking-wide">
              Loading Snapshot...
            </p>
          </div>
        </div>
      {/if}

      {#if previewContent && previewEditor}
        <Edra editor={previewEditor}>
          <Edra.Content
            class="min-w-full! overflow-auto w-full! cursor-auto px-12 py-8 text-base transition-all duration-300 *:outline-none"
          />
        </Edra>
      {/if}
    </div>
  </DialogContent>
</Dialog>
