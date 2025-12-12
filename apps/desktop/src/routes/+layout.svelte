<script lang="ts">
import '../app.css';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { check } from '@tauri-apps/plugin-updater';

let { children, data } = $props();
import { ModeWatcher } from '@nota/ui';
import { toast, Toaster } from '@nota/ui/shadcn/sonner';
import AppSideBar from '$lib/components/sidebar/app-sidebar.svelte';
import { onMount } from 'svelte';
import { downloadAndInstall } from '$lib/updater';
import { setLocalUserWorkspaces } from '$lib/local/userworkspaces.svelte';
import { setLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { setLocalNotes } from '$lib/local/notes.svelte';
import { getSessionAndUserContext, setSessionAndUserContext } from '$lib/supabase/user.svelte';
import { setCurrentUserWorkspaceContext } from '$lib/components/user-workspace/userworkspace.svelte';
import { setCloudUserWorkspaces } from '$lib/supabase/db/clouduserworkspaces.svelte';
import { setCloudWorkspaces } from '$lib/supabase/db/cloudworkspace.svelte';
import { setCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
import { useDeepLinkAuth } from '$lib/handleOAuth';
import { setGlobalSignInContext } from '$lib/components/global-signin';
import { setGlobalSettings } from '$lib/components/settings';
import { setTheme } from '$lib/theme';
import { auth } from '$lib/supabase';
import { invalidate } from '$app/navigation';

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
const useSettings = setGlobalSettings();
const sessionAndUser = setSessionAndUserContext();

onMount(() => {
  open = localStorage.getItem('sidebar-state') === 'open';

  setTheme(useSettings.themeColor);
  const id = toast.loading('Authenticating...');
  const { data } = auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') {
      if (session) {
        toast.success('Signed in successfully!', { id });
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
      toast.info(`New Version available`, {
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
    currentUserWorkspace.setCurrentUserWorkspace(data.currentUserWorkspace!);
    localUserWorkspaces.setUserWorkspaces(data.localUserWorkspaces!);
    localWorkspaces.setWorkspaces(data.localWorkspaces!);
    localNotes.setNotes(data.localNotes!);
  }
});
</script>


<ModeWatcher />
<Toaster richColors />
{@render children()}

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
