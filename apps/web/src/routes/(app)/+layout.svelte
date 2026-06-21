<script lang="ts">
  import { setNotesContext, setWorkspacesContext, setStorageContext } from '@nota/client';
  import * as Sidebar from '@nota/ui/shadcn/sidebar';
  import { toast } from '@nota/ui/shadcn/sonner';
  import NewNote from '$lib/components/dialogs/new-note.svelte';
  import NewWorkspace from '$lib/components/dialogs/new-workspace.svelte';
  import GlobalSearch from '$lib/components/global-search.svelte';
  import AppSideBar from '$lib/components/sidebar/app-sidebar.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { currentWorkspace } from '$lib/currentworkspace.svelte';

  let { children, data } = $props();
  let open = $state(true);

  const cloudWorkspaces = setWorkspacesContext();
  const cloudNotes = setNotesContext();
  const storage = setStorageContext();

  onMount(() => {
    cloudWorkspaces.workspaces = data.workspaces

    const stored = localStorage.getItem("sidebar-state");
    if (stored) {
      open = stored === "open";
    }
  })

  // Track the current workspace
  $effect(() => {
    const routeId = page.route.id;
    const workspaces = cloudWorkspaces.workspaces;

    if (routeId?.includes('/workspace-[id]')) {
      const activeId = page.params.id;
      const found = workspaces.find((w) => String(w.id) === String(activeId));
      if (found) {
        currentWorkspace.value = found;
      }
    } else if (!currentWorkspace.value && workspaces.length > 0) {
      // Fallback
      currentWorkspace.value = workspaces[0];
    }
  });

  // Fetch notes for the active workspace whenever it changes
  $effect(() => {
    const activeId = currentWorkspace.value?.id;
    if (activeId && page.route.id?.includes('/workspace-[id]')) {
      // We are in a workspace view, fetch notes for this workspace
      cloudNotes.notes = [];
      const promise = cloudNotes.fetchByWorkspace(String(activeId));
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
