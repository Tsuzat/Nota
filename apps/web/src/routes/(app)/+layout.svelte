<script lang="ts">
import {
  getAuthContext,
  setNotesContext,
  setStorageContext,
  setVersionsContext,
  setWorkspacesContext,
} from '@nota/client';
import DeleteWorkspaceDialog from '@nota/ui/custom/DeleteWorkspaceDialog.svelte';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { onMount } from 'svelte';
import { MoveNote, NewNotes, NewWorkspace, RenameNote } from '$lib/components/dialogs';
import { setGlobalSettings } from '$lib/components/settings/index.svelte';
import AppSideBar from '$lib/components/sidebar/app-sidebar.svelte';
import { GlobalSearch } from '$lib/components/sidebar/global-search';
import { setCurrentWorkspace } from '$lib/currentworkspace.svelte';

const { children } = $props();

setGlobalSettings();
const authContext = getAuthContext();
const workspaces = setWorkspacesContext();
const notes = setNotesContext();
const storage = setStorageContext();
setVersionsContext();

const currentWorkspace = setCurrentWorkspace();
const user = $derived(authContext.user);

let sidebarOpen = $state(true);

onMount(async () => {
  if (user) {
    await workspaces.fetch();
    await notes.fetchShared().catch(console.error);
    // Auto-select first workspace if none is selected
    if (!currentWorkspace.get() && workspaces.workspaces.length > 0) {
      const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
      const lastWorkspace = workspaces.workspaces.find((w) => w.id === lastWorkspaceId);
      if (lastWorkspace) {
        currentWorkspace.set(lastWorkspace);
      } else {
        currentWorkspace.set(workspaces.workspaces[0]);
      }
    }
  }
});

$effect(() => {
  const active = currentWorkspace.get();
  if (active) {
    localStorage.setItem('lastWorkspaceId', active.id);
    toast.promise(Promise.all([notes.fetchByWorkspace(active.id), storage.fetch({ workspaceId: active.id })]), {
      loading: 'Loading workspace...',
      success: 'Workspace loaded',
      error: 'Failed to load workspace',
    });
  } else {
    notes.notes = [];
  }
});
</script>

<GlobalSearch />
<NewNotes />
<NewWorkspace />
<MoveNote />
<RenameNote />
<DeleteWorkspaceDialog />

<Sidebar.Provider bind:open={sidebarOpen}>
  <AppSideBar />
  <Sidebar.Inset>
    <main class="flex h-dvh flex-col overflow-hidden bg-background">
      <div class="flex-1 overflow-y-auto">
        {@render children()}
      </div>
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
