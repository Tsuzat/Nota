<script lang="ts">
  import { getWorkspacesContext, type Workspace } from '@nota/client';
  import { IconRenderer, icons } from '@nota/ui/icons/index.js';
  import { Button } from '@nota/ui/shadcn/button';
  import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
  import { toast } from '@nota/ui/shadcn/sonner';
  import { timeAgo } from '@nota/ui/utils';
  import { goto } from '$app/navigation';
  import { openNewWorkspace } from '$lib/components/dialogs/new-workspace.svelte';
  import Topbar from '$lib/components/topbar.svelte';

  const cloudWorkspaces = getWorkspacesContext();
  const workspaces = $derived(cloudWorkspaces.workspaces);

  async function deleteWorkspace(workspace: Workspace) {
    const confirmed = confirm(
      `Are you sure you want to delete "${workspace.name}" and all its notes? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await cloudWorkspaces.delete(workspace.id);
      toast.success('Workspace deleted successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete workspace');
    }
  }
</script>

<div class="flex h-screen w-full flex-col text-foreground">
  <Topbar>
    {#snippet left()}
      <div class="flex items-center gap-2 text-muted-foreground">
        <icons.LayoutGrid class="size-4" />
        <span class="font-medium text-sm">Dashboard</span>
      </div>
    {/snippet}
  </Topbar>

  <div class="flex-1 overflow-auto p-6 md:p-10">
    <div class="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Workspaces
          </h1>
          <p class="text-muted-foreground">Manage your cloud workspaces and notes beautifully.</p>
        </div>
        <Button onclick={openNewWorkspace} class="gap-2 shadow-sm rounded-full px-6 transition-all hover:shadow-md hover:-translate-y-0.5">
          <icons.Plus class="size-4" />
          New Workspace
        </Button>
      </div>

      {#if workspaces.length === 0}
        <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-primary/5 p-16 text-center mt-10 transition-all hover:bg-primary/10">
          <div class="mx-auto flex size-24 items-center justify-center rounded-full bg-background text-primary border border-primary/10 shadow-sm mb-6 transition-transform hover:scale-110 duration-300">
            <icons.FolderPlus class="size-10" />
          </div>
          <h2 class="text-2xl font-semibold mb-2">Create your first workspace</h2>
          <p class="text-muted-foreground mb-8 max-w-sm">
            Workspaces help you group and organize your notes seamlessly. Get started now.
          </p>
          <Button onclick={openNewWorkspace} size="lg" class="gap-2 rounded-full shadow-lg">
            <icons.CirclePlus class="size-5" />
            Get Started
          </Button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each workspaces as workspace (workspace.id)}
            <div class="group relative flex flex-col rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card hover:border-primary/30">
              <div class="flex items-start justify-between mb-6">
                <div class="bg-gradient-to-br from-primary/20 to-primary/5 flex size-14 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-110">
                  <IconRenderer class="size-7 text-primary" icon={workspace.icon || "lucide:Folder"} />
                </div>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger class="inline-flex items-center justify-center rounded-full text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10 relative">
                      <icons.Ellipsis class="size-4 text-muted-foreground" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" class="rounded-xl shadow-lg">
                    <DropdownMenu.Item onclick={() => goto(`/workspace-${workspace.id}`)}>
                      <icons.FolderOpen class="mr-2 size-4" />
                      Open
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item variant="destructive" onclick={() => deleteWorkspace(workspace)}>
                      <icons.Trash2 class="mr-2 size-4" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
              
              <div class="space-y-1 z-0">
                <h3 class="font-semibold text-xl line-clamp-1">
                  <a href="/workspace-{workspace.id}" class="hover:text-primary transition-colors focus:outline-none stretched-link before:absolute before:inset-0 before:z-0">
                    {workspace.name}
                  </a>
                </h3>
                <p class="text-xs text-muted-foreground flex items-center gap-1.5 opacity-80">
                  <icons.Clock class="size-3" />
                  Updated {timeAgo(workspace.updated_at)}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
