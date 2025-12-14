<script lang="ts">
import '@fontsource-variable/inter';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import '../app.css';

let { children, data } = $props();

import { ModeWatcher } from '@nota/ui';
import { Toaster, toast } from '@nota/ui/shadcn/sonner';
import { check } from '@tauri-apps/plugin-updater';
import { onMount } from 'svelte';
import { invalidate } from '$app/navigation';
import { setGlobalSearch } from '$lib/components/global-search';
import GlobalSearch from '$lib/components/global-search/global-search.svelte';
import { setGlobalSignInContext } from '$lib/components/global-signin';
import GlobalSignin from '$lib/components/global-signin/global-signin.svelte';
import { GlobalSettings, setGlobalSettings } from '$lib/components/settings';
import AppSideBar from '$lib/components/sidebar/app-sidebar.svelte';
import { setCurrentUserWorkspaceContext } from '$lib/components/user-workspace/userworkspace.svelte';
import { useDeepLinkAuth } from '$lib/handleOAuth';
import { setLocalNotes } from '$lib/local/notes.svelte';
import { setLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
import { setLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { supabase } from '$lib/supabase';
import { setCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
import { setCloudUserWorkspaces } from '$lib/supabase/db/clouduserworkspaces.svelte';
import { setCloudWorkspaces } from '$lib/supabase/db/cloudworkspace.svelte';
import { getSessionAndUserContext, setSessionAndUserContext } from '$lib/supabase/user.svelte';
import { setTheme } from '$lib/theme';
import { downloadAndInstall } from '$lib/updater';

// Local Workspaces and Notes
const localUserWorkspaces = setLocalUserWorkspaces();
const localWorkspaces = setLocalWorkspaces();
const localNotes = setLocalNotes();

// Cloud Workspaces and Notes
const cloudUserWorkspaces = setCloudUserWorkspaces();
const cloudWorkspaces = setCloudWorkspaces();
const cloudNotes = setCloudNotes();

const currentUserWorkspace = setCurrentUserWorkspaceContext();

const user = $derived(getSessionAndUserContext().getUser());

let open = $state(localStorage.getItem('sidebar-state') === 'open');

$effect(() => {
  if (user === null) {
    cloudUserWorkspaces.setWorkspace([]);
    cloudWorkspaces.setWorkspaces([]);
    cloudNotes.setNotes([]);
  } else {
    cloudUserWorkspaces.fetchWorkspaces(user);
  }
});

useDeepLinkAuth();
setGlobalSignInContext();
setGlobalSearch();
const useSettings = setGlobalSettings();
const sessionAndUser = setSessionAndUserContext();

onMount(() => {
  setTheme(useSettings.themeColor);
  const id = toast.loading('Checking auth status...', { duration: 5000 });
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') {
      if (session) {
        toast.success('Signed in successfully', { id });
      } else {
        toast.dismiss(id);
      }
    }
    if (event === 'SIGNED_OUT') {
      sessionAndUser.setSession(null);
      sessionAndUser.setUser(null);
      invalidate('supabase:auth');
    } else if (session) {
      sessionAndUser.setSession(session);
      sessionAndUser.setUser(session.user);
      if (event === 'SIGNED_IN') {
        invalidate('supabase:auth');
      }
    }
  });
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
  return () => data.subscription.unsubscribe();
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

<Sidebar.Provider
	bind:open
	onOpenChange={(value: boolean) => {
		localStorage.setItem('sidebar-state', value ? 'open' : 'closed');
	}}
>
	<AppSideBar />
	<Sidebar.Inset class="flex h-screen w-full flex-col overflow-hidden">
		<div data-tauri-drag-region class="absolute top-0 z-10! h-12 w-full"></div>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
