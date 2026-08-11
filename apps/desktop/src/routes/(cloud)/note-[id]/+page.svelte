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
    getVersionsContext,
    type Note,
    type SelectableModel,
    secureStorage,
  } from "@nota/client";
  import { NoteTopbarActions, type ActiveUser } from "@nota/ui/custom/index.js";
  import { createEditor, Edra } from "@nota/ui/edra/index.js";
  import { IconPicker, IconRenderer, icons } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import { toast } from "@nota/ui/shadcn/sonner";
  import { basename } from "@tauri-apps/api/path";
  import { open } from "@tauri-apps/plugin-dialog";
  import { readFile } from "@tauri-apps/plugin-fs";
  import { onDestroy, onMount } from "svelte";
  import { afterNavigate, goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getGlobalSettings } from "$lib/components/settings/index.js";
  import NavActions from "$lib/components/sidebar/nav-actions.svelte";
  import Topbar from "$lib/components/topbar.svelte";
  import { getCurrentWorkspace } from "$lib/currentworkspace.svelte.js";

  // --- Services & Context ---
  const cloudNotes = getNotesContext();
  const cloudStorage = getStorageContext();
  const versionsClient = getVersionsContext();
  const useGlobalSettings = getGlobalSettings();
  const useCurrentWorkspace = getCurrentWorkspace();
  const authContext = getAuthContext();
  const collaborators = getCollaboratorsContext();
  const isPro = $derived(authContext.user?.subscription_plan === "pro");

  import * as Y from "yjs";
  import { HocuspocusProvider } from "@hocuspocus/provider";
  import { PUBLIC_COLLABORATION_URL } from "$env/static/public";
  import { quickcolors } from "@lib/components/edra/utils.js";
  // --- State ---
  const { data } = $props();

  let isLoading = $state(true);
  let note = $state<Note>();
  let availableModels = $state<Record<string, SelectableModel[]>>({});
  let versionCount = $state(0);

  let status = $state<"connecting" | "connected" | "disconnected">(
    "connecting",
  );
  let activeUsers = $state<ActiveUser[]>([]);

  let raf = 0;

  function scheduleUpdate() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      syncUsers();
    });
  }

  function syncUsers() {
    if (!provider?.awareness) {
      if (status === "connected" && authContext.user) {
        activeUsers = [
          {
            name: authContext.user.name || "User",
            color: getRandomUserColor(),
            avatar: authContext.user.avatar_url || "",
            userId: authContext.user.id,
            clientId: 0,
          },
        ];
      } else {
        if (activeUsers.length) activeUsers = [];
      }
      return;
    }
    const selfId = provider.awareness.clientID as number;
    const states = provider.awareness.getStates();
    const list: ActiveUser[] = [];
    states.forEach((st: unknown, clientId: number) => {
      const user = (
        st as {
          user?: {
            name?: string;
            color?: string;
            avatar?: string;
            userId?: string;
          };
        }
      )?.user;
      if (user?.name) {
        list.push({
          name: String(user.name).slice(0, 32),
          color: user.color || "#7C3AED",
          avatar: user.avatar,
          userId: user.userId,
          clientId,
        });
      }
    });

    list.sort((a, b) => {
      if (a.clientId === selfId) return -1;
      if (b.clientId === selfId) return 1;
      return a.name.localeCompare(b.name);
    });

    if (
      list.length === activeUsers.length &&
      list.every(
        (u, i) =>
          u.clientId === activeUsers[i]?.clientId &&
          u.name === activeUsers[i]?.name &&
          u.color === activeUsers[i]?.color,
      )
    ) {
      return;
    }
    activeUsers = list;
  }
  // Fetch version count whenever note changes.
  $effect(() => {
    if (note?.id && isPro) {
      versionsClient.getVersionCount(note.id).then((c) => (versionCount = c));
    } else {
      versionCount = 0;
    }
  });

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

  let ydoc = $state.raw<Y.Doc | undefined>(undefined);
  let provider = $state.raw<HocuspocusProvider | undefined>(undefined);
  let editor = $state.raw<ReturnType<typeof createEditor> | undefined>(undefined);
  let currentNoteId = $state<string | undefined>(undefined);
  let currentProviderName = $state<string | undefined>(undefined);
  let loadInFlight = $state(false);
  let loadSeq = 0;

  function getRandomUserColor(): string {
    return quickcolors[Math.floor(Math.random() * quickcolors.length)].value;
  }

  function teardownEditor() {
    if (raf) cancelAnimationFrame(raf);
    editor?.destroy();
    try {
      provider?.disconnect();
      provider?.destroy();
    } catch {}
    ydoc?.destroy();
    currentProviderName = undefined;
  }

  // --- Editor Setup ---
  async function setupEditor(nextId: string): Promise<void> {
    const providerName = `note:${nextId}`;
    if (
      currentNoteId === nextId &&
      currentProviderName === providerName &&
      editor
    ) {
      return;
    }

    teardownEditor();
    currentNoteId = nextId;
    currentProviderName = providerName;
    const userColor = getRandomUserColor();

    const token = await secureStorage.getItem("access_token");
    ydoc = new Y.Doc();
    provider = new HocuspocusProvider({
      url: PUBLIC_COLLABORATION_URL,
      name: providerName,
      document: ydoc,
      token: token || undefined,
    });

    provider.on("status", ({ status: newStatus }: { status: string }) => {
      status = newStatus as any;
      scheduleUpdate();
    });
    provider.on("synced", () => scheduleUpdate());
    provider.on("connect", () => scheduleUpdate());
    provider.on("disconnect", () => {
      status = "disconnected";
      scheduleUpdate();
    });
    provider.awareness?.on("update", () => scheduleUpdate());

    editor = createEditor({
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
      openCollaboration: true,
      document: ydoc,
      provider,
      user: {
        name: authContext.user?.name || "User",
        color: userColor,
        avatar: authContext.user?.avatar_url || "",
        userId: authContext.user?.id,
      } as any,
    });

    return new Promise<void>((done) => {
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          done();
        }
      };
      const onSynced = () => {
        provider!.off("synced", onSynced);
        finish();
      };
      provider!.on("synced", onSynced);
      setTimeout(finish, 10_000);
    });
  }

  // --- Hooks ---
  afterNavigate(() => {
    if (data.id) loadData();
    getAllConfiguredModels().then((models) => {
      availableModels = models;
    });
  });

  onDestroy(() => {
    teardownEditor();
    currentNoteId = undefined;
  });

  // --- Data Operations ---
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
      return goto(resolve("/"));
    }

    collaborators.fetchMembers(id).catch(console.error);

    if (seq !== loadSeq) {
      loadInFlight = false;
      return;
    }

    try {
      await setupEditor(id);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong when loading note");
      goto(resolve("/"));
    } finally {
      if (seq === loadSeq) isLoading = false;
      loadInFlight = false;
    }
  }

  async function updateNote(name: string, icon: string, pinned: boolean) {
    if (!note) return;
    try {
      await cloudNotes.update(note.id, { name, icon, pinned });
      note.name = name;
      note.icon = icon;
      note.pinned = pinned;
    } catch (e) {
      toast.error("Could not update note");
      console.error(e);
    }
  }

  async function handleNameChange(e: Event) {
    if (!note) return;
    const target = e.target as HTMLInputElement;
    const value = target.value.trim();
    if (!value) return;
    await updateNote(value, note.icon, note.pinned);
  }
</script>

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
        <NoteTopbarActions
          members={collaborators.members}
          isLoadingMembers={collaborators.isLoading}
          isPublic={note?.is_public ?? false}
          {versionCount}
          {activeUsers}
          connectionStatus={status}
          currentUserId={authContext.user?.id}
          versionsHref={`/versions?note_ids=${note!.id}&source=cloud`}
          onTogglePublic={() => {
            if (note)
              cloudNotes.update(note.id, { is_public: !note.is_public });
          }}
          onAddMember={async (email, role) => {
            await collaborators.addMember(data.id, email, role);
          }}
          onRemoveMember={async (id) => {
            await collaborators.removeMember(data.id, id);
          }}
          onUpdateRole={async (id, role) => {
            await collaborators.updateRole(data.id, id, role);
          }}
        />
        <NavActions
          starred={Boolean(note?.pinned)}
          toggleStar={() => {
            if (note) updateNote(note.name, note.icon, !note.pinned);
          }}
          editor={editor!}
          note={note!}
          bind:versionCount
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
