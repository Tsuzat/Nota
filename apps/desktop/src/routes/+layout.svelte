<script lang="ts">
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import "../app.css";

  let { children, data } = $props();

  import {
    setAuthContext,
    setNotesContext,
    setStorageContext,
    setUserWorkspacesContext,
    setWorkspacesContext,
  } from "@nota/client";
  import { ModeWatcher } from "@nota/ui";
  import { Toaster, toast } from "@nota/ui/shadcn/sonner";
  import { check } from "@tauri-apps/plugin-updater";
  import { onMount } from "svelte";
  import { setGlobalSearch } from "$lib/components/global-search";
  import GlobalSearch from "$lib/components/global-search/global-search.svelte";
  import { setGlobalSignInContext } from "$lib/components/global-signin";
  import GlobalSignin from "$lib/components/global-signin/global-signin.svelte";
  import { GlobalSettings, setGlobalSettings } from "$lib/components/settings";
  import AppSideBar from "$lib/components/sidebar/app-sidebar.svelte";
  import {
    NewUserWorkspace,
    setNewUserWorkspace,
  } from "$lib/components/user-workspace";
  import { setCurrentUserWorkspaceContext } from "$lib/components/user-workspace/userworkspace.svelte";
  import { useDeepLinkAuth } from "$lib/handleOAuth";
  import { setLocalNotes } from "$lib/local/notes.svelte";
  import { setLocalUserWorkspaces } from "$lib/local/userworkspaces.svelte";
  import { setLocalWorkspaces } from "$lib/local/workspaces.svelte";
  import { setTheme } from "$lib/theme";
  import { downloadAndInstall } from "$lib/updater";
  import { Button } from "@lib/components/ui/button";
  import { icons } from "@lib/icons";
  import WindowsButtons from "$lib/components/windows-buttons.svelte";
  import { getKeyboardShortcut, ISMACOS, ISWINDOWS } from "$lib/utils";
  import { setSidebar } from "@lib/components/ui/sidebar/context.svelte";
  import AppMenu from "$lib/components/app-menu.svelte";
  import { SimpleToolTip, ToggleMode } from "@lib/components/custom";

  // Local Workspaces and Notes
  const localUserWorkspaces = setLocalUserWorkspaces();
  const localWorkspaces = setLocalWorkspaces();
  const localNotes = setLocalNotes();

  // Cloud Workspaces and Notes
  const cloudUserWorkspaces = setUserWorkspacesContext();
  const cloudWorkspaces = setWorkspacesContext();
  const cloudNotes = setNotesContext();
  const cloudStorage = setStorageContext();

  const currentUserWorkspace = setCurrentUserWorkspaceContext();
  setNewUserWorkspace();

  const authContext = setAuthContext();
  const user = $derived(authContext.user);

  let open = $state(localStorage.getItem("sidebar-state") === "open");

  $effect(() => {
    if (!user) {
      cloudUserWorkspaces.userWorkspaces = [];
      cloudWorkspaces.workspaces = [];
      cloudNotes.notes = [];
    } else {
      cloudUserWorkspaces.fetch();
      cloudStorage.fetch();
    }
  });

  useDeepLinkAuth({
    onCode: (code) => authContext.exchangeCode(code),
  });

  setGlobalSignInContext();
  setGlobalSearch();
  const useSettings = setGlobalSettings();

  onMount(async () => {
    setTheme(useSettings.themeColor);
    if (localStorage.getItem("access_token")) {
      toast.promise(authContext.init(), {
        loading: "Signing you in...",
        success: "Successfully signed in",
        error: "Please signin again.",
      });
    }
    check().then((update) => {
      if (update) {
        const id = Symbol("CheckForNotaUpdate").toString();
        toast.info("New Version available", {
          description: `Update to latest version ${update.version}, this will take less than a minute`,
          id,
          action: {
            label: "Install",
            onClick: () => {
              toast.dismiss(id);
              downloadAndInstall(update);
            },
          },
        });
      }
    });
    // const window = getCurrentWindow();
    // window.show().then(() => {
    //   if (ISWINDOWS) window.setDecorations(false);
    // });
  });

  $effect(() => {
    if (
      data.localUserWorkspaces === undefined ||
      data.currentUserWorkspace === undefined ||
      data.localWorkspaces === undefined ||
      data.localNotes === undefined
    ) {
      toast.error("Something went wrong when loading the local data");
    } else {
      currentUserWorkspace.setCurrentUserWorkspace(data.currentUserWorkspace);
      localUserWorkspaces.setUserWorkspaces(data.localUserWorkspaces);
      localWorkspaces.setWorkspaces(data.localWorkspaces);
      localNotes.setNotes(data.localNotes);
    }
  });

  const sidebar = setSidebar({
    open: () => open,
    setOpen: (value: boolean) => {
      localStorage.setItem("sidebar-state", value ? "open" : "closed");
    },
  });
</script>

<ModeWatcher />
<Toaster richColors closeButton />

<GlobalSignin />
<GlobalSearch />
<GlobalSettings />
<NewUserWorkspace />
<header
  data-tauri-drag-region
  class="bg-sidebar flex items-center justify-between h-10 w-full"
>
  <div class:ml-24={ISMACOS} class="flex items-center gap-1 ml-4">
    {#if ISWINDOWS}
      <AppMenu />
      <small>Nota</small>
    {/if}
    <SimpleToolTip
      content="Toggle Sidebar"
      keyboard={getKeyboardShortcut("\\", true)}
    >
      <Button variant="ghost" size="icon" onclick={() => (open = !open)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 56 56"
        >
          <path d="M0 0h56v56H0z" fill="none" />
          <path
            fill="currentColor"
            d="M7.715 49.574h40.57c4.899 0 7.36-2.437 7.36-7.265V13.69c0-4.828-2.461-7.265-7.36-7.265H7.715C2.84 6.426.355 8.84.355 13.69v28.62c0 4.851 2.485 7.265 7.36 7.265m.07-3.773c-2.344 0-3.656-1.242-3.656-3.68V13.88c0-2.438 1.312-3.68 3.656-3.68h10.43v35.602ZM48.215 10.2c2.32 0 3.656 1.242 3.656 3.68v28.24c0 2.438-1.336 3.68-3.656 3.68h-26.32V10.199Zm-34.5 8.696c.703 0 1.336-.633 1.336-1.313c0-.703-.633-1.312-1.336-1.312h-5.04c-.702 0-1.312.609-1.312 1.312c0 .68.61 1.313 1.313 1.313Zm0 6.07c.703 0 1.336-.633 1.336-1.336s-.633-1.29-1.336-1.29h-5.04c-.702 0-1.312.587-1.312 1.29s.61 1.336 1.313 1.336Zm0 6.047c.703 0 1.336-.586 1.336-1.29c0-.702-.633-1.312-1.336-1.312h-5.04c-.702 0-1.312.61-1.312 1.313s.61 1.289 1.313 1.289Z"
          />
        </svg>
      </Button>
    </SimpleToolTip>
    <SimpleToolTip content="Go Back" keyboard={getKeyboardShortcut("←", true)}>
      <Button variant="ghost" size="icon" onclick={history.back}>
        <icons.ArrowLeft />
      </Button>
    </SimpleToolTip>
    <SimpleToolTip content="Go Next" keyboard={getKeyboardShortcut("→", true)}>
      <Button variant="ghost" size="icon" onclick={history.forward}>
        <icons.ArrowRight />
      </Button>
    </SimpleToolTip>
  </div>
  <div class:mr-4={ISMACOS} class="inline-flex items-center gap-2">
    <ToggleMode />
    {#if ISWINDOWS}
      <WindowsButtons />
    {/if}
  </div>
</header>
<Sidebar.Provider
  class="h-[calc(100svh-2.5rem)]! max-h-[calc(100svh-2.5rem)]! overflow-hidden! flex-1"
  bind:open
>
  <AppSideBar class="top-10 h-[calc(100svh-2.5rem)]" />
  <Sidebar.Inset class="h-full overflow-hidden">
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
