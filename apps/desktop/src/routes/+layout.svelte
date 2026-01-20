<script lang="ts">
import '@fontsource-variable/inter';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import '../app.css';

let { children, data } = $props();

import {
  authClient,
  setAuthContext,
  setNotesContext,
  setStorageContext,
  setUserWorkspacesContext,
  setWorkspacesContext,
} from '@nota/client';
import { ModeWatcher } from '@nota/ui';
import { Toaster, toast } from '@nota/ui/shadcn/sonner';
import { check } from '@tauri-apps/plugin-updater';
import { onDestroy, onMount } from 'svelte';
import { setGlobalSearch } from '$lib/components/global-search';
import GlobalSearch from '$lib/components/global-search/global-search.svelte';
import { setGlobalSignInContext } from '$lib/components/global-signin';
import GlobalSignin from '$lib/components/global-signin/global-signin.svelte';
import { GlobalSettings, setGlobalSettings } from '$lib/components/settings';
import AppSideBar from '$lib/components/sidebar/app-sidebar.svelte';
import { NewUserWorkspace, setNewUserWorkspace } from '$lib/components/user-workspace';
import { setCurrentUserWorkspaceContext } from '$lib/components/user-workspace/userworkspace.svelte';
import { setLocalNotes } from '$lib/local/notes.svelte';
import { setLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
import { setLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { setTheme } from '$lib/theme';
import { downloadAndInstall } from '$lib/updater';
  import { setupBetterAuthTauri } from '@daveyplate/better-auth-tauri';

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

let open = $state(localStorage.getItem('sidebar-state') === 'open');

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



setGlobalSignInContext();
setGlobalSearch();
const useSettings = setGlobalSettings();

let cleanup: (() => void) | undefined;
onMount(async () => {
  cleanup = setupBetterAuthTauri({
    authClient,
    scheme: "nota",
    debugLogs: false,
    onRequest: (href) => {
      toast.info('Signing you in...');
      console.log("Auth request:", href);
    },
    onSuccess: () => {
      console.log("Auth successful");
      toast.success('Successfully signed in');
      },
      onError: (error) => {
        console.error("Auth error:", error);
        toast.error('Please signin again.');
      },
    });
  setTheme(useSettings.themeColor);
  if (localStorage.getItem('access_token')) {
    toast.promise(authContext.init(), {
      loading: 'Signing you in...',
      success: 'Successfully signed in',
      error: 'Please signin again.',
    });
  }
  check().then((update) => {
    if (update) {
      const id = Symbol('CheckForNotaUpdate').toString();
      toast.info('New Version available', {
        description: `Update to latest version ${update.version}, this will take less than a minute`,
        id,
        action: {
          label: 'Install',
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

onDestroy(() => {
    cleanup?.();
});

$effect(() => {
  if (
    data.localUserWorkspaces === undefined ||
    data.currentUserWorkspace === undefined ||
    data.localWorkspaces === undefined ||
    data.localNotes === undefined
  ) {
    toast.error('Something went wrong when loading the local data');
  } else {
    currentUserWorkspace.setCurrentUserWorkspace(data.currentUserWorkspace);
    localUserWorkspaces.setUserWorkspaces(data.localUserWorkspaces);
    localWorkspaces.setWorkspaces(data.localWorkspaces);
    localNotes.setNotes(data.localNotes);
  }
});
</script>

<ModeWatcher />
<Toaster richColors closeButton />

<GlobalSignin />
<GlobalSearch />
<GlobalSettings />
<NewUserWorkspace />

<div data-tauri-drag-region class="absolute top-0 z-10! h-12 w-full"></div>
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
