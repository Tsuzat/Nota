<script lang="ts">
  import {
    ALLOWED_MAX_FILE_SIZE,
    FileType,
    getFileTypeExtensions,
  } from "@lib/components/edra/utils.js";
  import { Skeleton } from "@lib/components/ui/skeleton/index.js";
  import {
    callAI,
    getAuthContext,
    getNotesContext,
    getStorageContext,
    getWorkspacesContext,
    type Note,
    type SelectableModel,
  } from "@nota/client";
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { type Content, createEditor, Edra } from "@nota/ui/edra/index.js";
  import CollaboratorsDialog from "$lib/components/dialogs/collaborators-dialog.svelte";
  import { setCollaboratorsContext } from "@nota/client";
  import {
    BarSpinner,
    IconPicker,
    IconRenderer,
    icons,
  } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import { toast } from "@nota/ui/shadcn/sonner";
  import { compare } from "fast-json-patch";
  import { onDestroy, onMount } from "svelte";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getGlobalSettings } from "$lib/components/settings/index.svelte";
  import NavActions from "$lib/components/sidebar/nav-actions.svelte";
  import Topbar from "$lib/components/topbar.svelte";
  import { getCurrentWorkspace } from "$lib/currentworkspace.svelte";
  import { browser } from "$app/environment";
  import * as Y from "yjs";
  import { HocuspocusProvider } from "@hocuspocus/provider";
  import { PUBLIC_COLLABORATION_URL } from "$env/static/public";
  import UserAvatar from "$lib/components/custom/user-avatar.svelte";
  import { getRandomUserColor } from "@lib/utils.js";

  // --- Services & Context ---
  const cloudWorkspaces = getWorkspacesContext();
  const cloudNotes = getNotesContext();
  const cloudStorage = getStorageContext();
  const useGlobalSettings = getGlobalSettings();
  const authContext = getAuthContext();
  const collaborators = setCollaboratorsContext();
  const currentWorkspaceCtx = getCurrentWorkspace();
  const currentWorkspace = $derived(currentWorkspaceCtx.get());

  // --- State ---
  const { data } = $props();
  let syncedContent = $state<Content>();
  let isDirty = $state(false);

  // Note data derived from store
  let note = $state<Note>();

  let isLoading = $state(true);
  let syncing = $state(false);
  let syncingText = $state("");
  let availableModels = $state<Record<string, SelectableModel[]>>({});

  // --- File Handling Utilities ---
  const getAssets = async (fileType: FileType) => {
    const files = cloudStorage.files;
    const extensions = new Set(getFileTypeExtensions(fileType));
    const assets: string[] = [];
    for (const file of files) {
      const key = file.key;
      const fileExtension = key.split(".").pop();
      if (fileExtension !== undefined && extensions.has(fileExtension)) {
        assets.push(file.url);
      }
    }
    return assets;
  };

  const getLocalFile = async (fileType: FileType) => {
    return new Promise<string | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";

      if (fileType === FileType.IMAGE) input.accept = "image/*";
      else if (fileType === FileType.VIDEO) input.accept = "video/*";
      else if (fileType === FileType.AUDIO) input.accept = "audio/*";

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

  let ydoc = $state.raw<Y.Doc | undefined>(undefined);
  let provider = $state.raw<HocuspocusProvider | undefined>(undefined);
  let editor = $state.raw<ReturnType<typeof createEditor> | undefined>(
    undefined,
  );
  let isCollaborative = $state(false);
  let currentNoteId = $state<string | undefined>(undefined);
  let loadInFlight = $state(false);
  let loadSeq = 0;

  async function setupEditor(nextId: string, shouldCollab: boolean) {
    const providerName = `note:${nextId}`;
    const currentName = (provider as any)?.configuration?.name as
      | string
      | undefined;
    if (
      currentNoteId === nextId &&
      isCollaborative === shouldCollab &&
      currentName === providerName &&
      editor
    ) {
      return;
    }

    editor?.destroy();
    try {
      provider?.disconnect();
    } catch {}
    try {
      (provider as any)?.destroy?.();
    } catch {}
    ydoc?.destroy();

    currentNoteId = nextId;
    isCollaborative = shouldCollab;

    if (shouldCollab) {
      ydoc = new Y.Doc();
      provider = new HocuspocusProvider({
        url: PUBLIC_COLLABORATION_URL,
        name: providerName,
        document: ydoc,
        token: data.token,
      });
      provider.on("authenticationFailed", () => {
        toast.error("Collaboration authentication failed");
        isCollaborative = false;
        setupEditor(nextId, false);
      });
      provider.on("close" as any, (event: any) => {
        if (event?.event?.code === 1001 || event?.code === 1001) {
          console.warn("[collab] ws closed with 1001 (unauth queue)", event);
        }
      });
    } else {
      ydoc = undefined;
      provider = undefined;
    }

    editor = createEditor({
      onUpdate: () => {
        isDirty = true;
      },
      onFileUpload: (file) => {
        const user = authContext.user;
        if (user && user.used_storage + file.size > user.assigned_storage) {
          toast.error(`Not enough storage to upload ${file.name}.`);
          return Promise.reject(new Error("Storage quota exceeded"));
        }
        return cloudStorage.upload(file, {
          workspaceId: currentWorkspace?.id,
          noteId: note?.id,
        });
      },
      selectFile: getLocalFile,
      getAssets,
      callAI: (
        prompt: string,
        onChunk: (chunk: string) => void,
        onError?: (error: Error) => void,
      ) => {
        return callAI(prompt, note?.id || "", onChunk, onError);
      },
      openCollaboration: shouldCollab,
      document: ydoc,
      provider,
      user: {
        name: data.user.name || "User",
        color: getRandomUserColor(),
        avatar: data.user.avatar_url || "",
      },
    });
  }

  // --- Hooks ---
  // afterNavigate fires on every client navigation including the initial
  // hydration; keep it but dedup via loadInFlight/seq so we don't spawn
  // two concurrent providers.
  afterNavigate(() => {
    if (data.id) loadData();
  });

  $effect(() => {
    if (note?.workspace_id && cloudWorkspaces.workspaces.length > 0) {
      const workspace = cloudWorkspaces.workspaces.find(
        (w) => w.id === note?.workspace_id,
      );
      if (workspace && currentWorkspaceCtx.get()?.id !== workspace.id) {
        currentWorkspaceCtx.set(workspace);
      }
    }
  });

  onMount(() => {
    if (browser && data.id) loadData();
    // auto save is called in every 2 mins
    const saveInterval = setInterval(() => {
      saveNoteContent();
    }, 120000);
    return () => clearInterval(saveInterval);
  });

  beforeNavigate(async () => {
    if (isDirty && !isCollaborative) {
      await saveNoteContent();
    }
  });

  onDestroy(() => {
    editor?.destroy();
    try {
      provider?.disconnect();
    } catch {}
    try {
      (provider as any)?.destroy?.();
    } catch {}
    ydoc?.destroy();
    currentNoteId = undefined;
  });

  // --- Data Operations ---
  async function saveNoteContent() {
    if (!isDirty || !note || !editor || isCollaborative) return;

    const currentContent = editor.getJSON();
    if (
      syncedContent === undefined ||
      syncedContent === null ||
      typeof syncedContent === "string"
    ) {
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
      toast.error("Something went wrong when saving content to cloud");
    } finally {
      syncing = false;
    }
  }

  const withTimeout = <T,>(p: Promise<T>, ms: number) =>
    Promise.race([
      p,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
      ),
    ]);

  async function loadData() {
    if (loadInFlight) return;
    loadInFlight = true;
    const seq = ++loadSeq;
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
      loadInFlight = false;
      return goto(resolve("/(app)/home"));
    }

    let shouldCollab = false;
    try {
      await withTimeout(collaborators.fetchMembers(id), 8000);
      shouldCollab = collaborators.members.length > 0;
    } catch (e) {
      console.error(e);
      shouldCollab = false;
    }
    if (seq !== loadSeq) {
      loadInFlight = false;
      return;
    }

    await setupEditor(id, shouldCollab);
    if (seq !== loadSeq) {
      loadInFlight = false;
      return;
    }
    try {
      const fetched = await withTimeout(cloudNotes.fetchContent(id), 8000);
      if (seq !== loadSeq) {
        loadInFlight = false;
        return;
      }
      if (fetched) {
        const dbContent = fetched as Content;
        if (!isCollaborative) {
          editor?.commands.setContent(dbContent, { contentType: "json" });
          syncedContent = dbContent;
        }
        // collaborative: Yjs hydrates content via provider — skip setContent
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong when loading note");
      goto(resolve("/(app)/home"));
    } finally {
      if (seq === loadSeq) isLoading = false;
      loadInFlight = false;
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
      toast.error("Could not update note");
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
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveNoteContent();
    }
  }
</script>

<svelte:head>
  <title>{note?.name ? `${note.name} | Nota` : "Nota"}</title>
</svelte:head>

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
        {#if isCollaborative && collaborators.members.length > 0}
          <div class="flex items-center -space-x-2 mr-2">
            {#each collaborators.members.slice(0, 3) as member (member.id)}
              <UserAvatar
                image={member.avatar_url ?? ""}
                name={member.name ?? "Unknown"}
              />
            {/each}
            {#if collaborators.members.length > 3}
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium z-10"
              >
                +{collaborators.members.length - 3}
              </div>
            {/if}
          </div>
        {/if}
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
        <CollaboratorsDialog noteId={data.id} />
        <NavActions
          starred={Boolean(note?.pinned)}
          toggleStar={() => {
            if (note) updateNote(note.name, note.icon, !note.pinned);
          }}
          editor={editor!}
          note={note!}
        />
      {/snippet}
    </Topbar>
    {#key editor}
      <Edra editor={editor!}>
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
    {/key}
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
