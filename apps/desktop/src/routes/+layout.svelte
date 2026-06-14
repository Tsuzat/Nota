<script lang="ts">
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import "../app.css";

  let { children, data } = $props();

  import {
    setAuthContext,
    setNotesContext,
    setStorageContext,
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
  import { useDeepLinkAuth } from "$lib/handleOAuth";
  import { setLocalNotes } from "$lib/local/notes.svelte";
  import { setLocalWorkspaces } from "$lib/local/workspaces.svelte";
  import { setTheme } from "$lib/theme";
  import { downloadAndInstall } from "$lib/updater";
  import { setCurrentWorkspace } from "$lib/currentworkspace.svelte";
  import NewNotes from "$lib/components/dialogs/new-notes.svelte";

  // Local Workspaces and Notes
  const localWorkspaces = setLocalWorkspaces();
  const localNotes = setLocalNotes();
  const currentWorkspace = setCurrentWorkspace();

  // Cloud Workspaces and Notes
  const cloudWorkspaces = setWorkspacesContext();
  const cloudNotes = setNotesContext();
  const cloudStorage = setStorageContext();

  const authContext = setAuthContext();
  const user = $derived(authContext.user);

  let open = $state(localStorage.getItem("sidebar-state") === "open");

  $effect(() => {
    if (!user) {
      cloudWorkspaces.workspaces = [];
      cloudNotes.notes = [];
    } else {
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
  });

  $effect(() => {
    if (
      data.localWorkspaces === undefined ||
      data.localNotes === undefined
    ) {
      toast.error("Something went wrong when loading the local data");
    } else {
      localWorkspaces.setWorkspaces(data.localWorkspaces ?? []);
      localNotes.setNotes(data.localNotes ?? []);
    }
  }); 

  $effect(() => {
    const active = currentWorkspace.get();
    const locals = localWorkspaces.getWorkspaces();
    const clouds = cloudWorkspaces.workspaces;

    if (active) {
      const existsLocal = locals.some((w) => w.id === active.id);
      const existsCloud = clouds.some((w) => w.id === active.id);

      if (!existsLocal && !existsCloud) {
        if (locals.length > 0) {
          currentWorkspace.set(locals[0]);
        }
      }
    } else {
      if (locals.length > 0) {
        currentWorkspace.set(locals[0]);
      }
    }
  });
</script>

<ModeWatcher />
<Toaster richColors closeButton />

<GlobalSignin />
<GlobalSearch />
<GlobalSettings />
<NewNotes />

<Sidebar.Provider
	bind:open
	onOpenChange={(value: boolean) => {
		localStorage.setItem('sidebar-state', value ? 'open' : 'closed');
	}}
>
	<AppSideBar />
	<Sidebar.Inset class="flex h-screen w-full flex-col overflow-hidden">
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>