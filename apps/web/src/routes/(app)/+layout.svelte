<script lang="ts">
  import { setNotesContext, setWorkspacesContext, setStorageContext } from '@nota/client';
  import * as Sidebar from '@nota/ui/shadcn/sidebar';
  import { toast } from '@nota/ui/shadcn/sonner';
  import NewNote from '$lib/components/dialogs/new-note.svelte';
  import NewWorkspace from '$lib/components/dialogs/new-workspace.svelte';
  import GlobalSearch from '$lib/components/global-search.svelte';
  import AppSideBar from '$lib/components/sidebar/app-sidebar.svelte';
  import { onMount } from 'svelte';
  import { setCurrentWorkspaceContext } from '$lib/currentworkspace.svelte';
  import ConfirmDelete from '@lib/components/custom/dialogs/confirm-delete.svelte';

  let { children, data } = $props();
  let open = $state(true);

  const cloudWorkspaces = setWorkspacesContext();
  const cloudNotes = setNotesContext();
  const currentWorkspace = setCurrentWorkspaceContext();
  const storage = setStorageContext();

  onMount(() => {
    cloudWorkspaces.workspaces = data.workspaces
    currentWorkspace.value = data.workspaces[0];
    storage.fetch()
    const stored = localStorage.getItem("sidebar-state");
    if (stored) {
      open = stored === "open";
    }
  })


  // Fetch notes for the active workspace whenever it changes
  $effect(() => {
    if (currentWorkspace.value?.id) {
      // We are in a workspace view, fetch notes for this workspace
      cloudNotes.notes = [];
      const promise = cloudNotes.fetchByWorkspace(currentWorkspace.value.id);
      toast.promise(promise, {
        loading: 'Loading notes...',
        success: 'Notes loaded.',
        error: 'Failed to load notes.',
      });
    }
  });

</script>

<NewWorkspace />
<NewNote />
<GlobalSearch />
<ConfirmDelete />

<Sidebar.Provider
  bind:open
  onOpenChange={(value: boolean) => {
    localStorage.setItem("sidebar-state", value ? "open" : "closed");
  }}
>
  <AppSideBar />
  <Sidebar.Inset
    class="flex max-h-screen min-h-screen w-full flex-col overflow-hidden! bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
