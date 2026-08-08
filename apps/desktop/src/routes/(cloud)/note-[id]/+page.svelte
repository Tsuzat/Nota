<script lang="ts">
  import {
    ALLOWED_MAX_FILE_SIZE,
    type FileType,
    getFileTypeExtensions,
    getFileTypeFromExtension,
  } from "@lib/components/edra/utils.js";
  import { Skeleton } from "@lib/components/ui/skeleton/index.js";
  import {
    callAI,
    getAllConfiguredModels,
    getAuthContext,
    getNotesContext,
    getStorageContext,
    getCollaboratorsContext,
    type Note,
    type SelectableModel,
    secureStorage,
  } from "@nota/client";
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { type Content, createEditor, Edra } from "@nota/ui/edra/index.js";
  import {
    BarSpinner,
    IconPicker,
    IconRenderer,
    icons,
  } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import { toast } from "@nota/ui/shadcn/sonner";
  import { basename } from "@tauri-apps/api/path";
  import { open } from "@tauri-apps/plugin-dialog";
  import { readFile } from "@tauri-apps/plugin-fs";
  import { compare } from "fast-json-patch";
  import { onDestroy, onMount } from "svelte";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getGlobalSettings } from "$lib/components/settings/index.js";
  import NavActions from "$lib/components/sidebar/nav-actions.svelte";
  import Topbar from "$lib/components/topbar.svelte";
  import { getCurrentWorkspace } from "$lib/currentworkspace.svelte.js";

  // --- Services & Context ---
  const cloudNotes = getNotesContext();
  const cloudStorage = getStorageContext();
  const useGlobalSettings = getGlobalSettings();
  const useCurrentWorkspace = getCurrentWorkspace();
  const authContext = getAuthContext();
  const collaborators = getCollaboratorsContext();

  import { Avatar, AvatarFallback, AvatarImage } from "@nota/ui/shadcn/avatar";
  import CollaboratorsDialog from "$lib/components/dialogs/collaborators-dialog.svelte";

  import * as Y from "yjs";
  import { HocuspocusProvider } from "@hocuspocus/provider";
  import { PUBLIC_COLLABORATION_URL } from "$env/static/public";
  import { quickcolors } from "@lib/components/edra/utils.js";
  // --- State ---
  const { data } = $props();
  let syncedContent = $state<Content>();
  let isDirty = $state(false);

  let isLoading = $state(true);
  let note = $state<Note>();
  let syncing = $state(false);
  let syncingText = $state("");
  let availableModels = $state<Record<string, SelectableModel[]>>({});

  // --- File Handling Utilities ---
  const onFileSelect = async (path: string) => {
    const bytes = await readFile(path);
    const name = await basename(path);
    const extension = getFileTypeFromExtension(name);
    if (extension === null) {
      toast.error("Unsupported file is being uploaded. Rejected the Upload.");
      throw new Error(
        "Unsupported file is being uploaded. Rejected the Upload.",
      );
    }
    const file = new File([bytes], name, { type: extension });

    if (file.size > ALLOWED_MAX_FILE_SIZE) {
      toast.error(`File ${file.name} is too large (max 50MB).`);
      return null;
    }

    const user = authContext.user;
    if (user && user.used_storage + file.size > user.assigned_storage) {
      toast.error(`Not enough storage to upload ${file.name}.`);
      return null;
    }

    const uploadPromise = cloudStorage.upload(file, {
      workspaceId: useCurrentWorkspace.get()?.id,
      noteId: note?.id,
    });

    toast.promise(uploadPromise, {
      loading: `Uploading ${file.name}...`,
      success: `${file.name} uploaded successfully`,
      error: `Failed to upload ${file.name}`,
    });

    return await uploadPromise;
  };

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
    const extensions = getFileTypeExtensions(fileType);
    const file = await open({
      title: "Select File",
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Select File",
          extensions,
        },
      ],
    });
    if (!file) return null;
    return await onFileSelect(file);
  };

  let ydoc = $state<Y.Doc>();
  let provider = $state<HocuspocusProvider>();
  let editor = $state<ReturnType<typeof createEditor>>();
  let isCollaborative = $state(false);

  function getRandomUserColor(): string {
    return quickcolors[Math.floor(Math.random() * quickcolors.length)].value;
  }

  // --- Editor Setup ---
  async function setupEditor() {
    if (isCollaborative) {
      const token = await secureStorage.getItem("access_token");
      ydoc = new Y.Doc();
      provider = new HocuspocusProvider({
        url: PUBLIC_COLLABORATION_URL,
        name: `note:${data.id}`,
        document: ydoc,
        token,
      });
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
          workspaceId: useCurrentWorkspace.get()?.id,
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
      openCollaboration: isCollaborative,
      document: ydoc,
      provider,
      user: {
        name: authContext.user?.name || "User",
        color: getRandomUserColor(),
        avatar: authContext.user?.avatar_url || "",
      },
    });
  }

  // --- Hooks ---
  afterNavigate(() => {
    if (data.id) loadData();
    getAllConfiguredModels().then((models) => {
      availableModels = models;
    });
  });

  // Removed redundant effect since fetch is in loadData
  onMount(() => {
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
    provider?.disconnect();
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

  async function loadData() {
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
      return goto(resolve("/"));
    }

    try {
      await collaborators.fetchMembers(id);
      isCollaborative = collaborators.members.length > 0;
    } catch (e) {
      console.error(e);
      isCollaborative = false;
    }

    try {
      const data = await cloudNotes.fetchContent(id);
      if (data) {
        const dbContent = data as Content;

        if (!editor) await setupEditor();

        if (!isCollaborative) {
          editor?.commands.setContent(dbContent, { contentType: "json" });
          syncedContent = dbContent;
        }
      } else {
        if (!editor) await setupEditor();
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong when loading note");
      goto(resolve("/"));
    } finally {
      isLoading = false;
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
            {#each collaborators.members.slice(0, 3) as member}
              <Avatar class="border-2 border-background h-8 w-8">
                <AvatarImage src={member.avatar_url || ""} />
                <AvatarFallback class="text-xs">
                  {member.name?.[0]?.toUpperCase() ||
                    member.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
        <CollaboratorsDialog noteId={data.id} />
        <SimpleToolTip content={syncing ? syncingText : "Synced"}>
          <Button variant="ghost" size="icon">
            {#if syncing}
              <BarSpinner />
            {:else}
              <icons.Cloud />
            {/if}
          </Button>
        </SimpleToolTip>
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
    <Edra {editor}>
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
      href={resolve("/")}
      variant="outline"
      class="mt-4 rounded-full px-6"
    >
      Go to Home
    </Button>
  </div>
{/if}
