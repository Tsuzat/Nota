<script lang="ts">
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import { setNotesContext, setWorkspacesContext } from "@nota/client";
  import { toast } from "@nota/ui/shadcn/sonner";
  import AppSideBar from "$lib/components/sidebar/app-sidebar.svelte";
  import NewWorkspace from "$lib/components/dialogs/new-workspace.svelte";
  import NewNote from "$lib/components/dialogs/new-note.svelte";

  let { children, data } = $props();

  const cloudWorkspaces = setWorkspacesContext();
  const cloudNotes = setNotesContext();

  // Set workspaces list from server-side layout data
  $effect(() => {
    if (data.workspaces) {
      cloudWorkspaces.workspaces = data.workspaces;
    }
  });

  // Fetch notes for the current active workspace whenever id changes
  $effect(() => {
    const activeId = data.workspaceId;
    if (activeId) {
      cloudNotes.notes = [];
      const promise = cloudNotes.fetchByWorkspace(activeId);
      toast.promise(promise, {
        loading: "Loading workspace notes...",
        success: "Workspace loaded.",
        error: "Failed to load notes.",
      });
    }
  });

  let open = $state(true);
</script>

<NewWorkspace />
<NewNote />

<Sidebar.Provider
  bind:open
  onOpenChange={(value: boolean) => {
    localStorage.setItem("sidebar-state", value ? "open" : "closed");
  }}
>
  <AppSideBar />
  <Sidebar.Inset
    class="flex max-h-screen min-h-screen w-full flex-col overflow-hidden!"
  >
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
