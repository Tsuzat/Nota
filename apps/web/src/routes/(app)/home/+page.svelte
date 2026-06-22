<script lang="ts">
import { confirmDelete } from '@lib/components/custom';
import { toast } from '@lib/components/ui/sonner';
import { getWorkspacesContext, type Workspace } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import { timeAgo } from '@nota/ui/utils';
import { goto } from '$app/navigation';
import { openNewWorkspace } from '$lib/components/dialogs/new-workspace.svelte';
import Topbar from '$lib/components/topbar.svelte';
import { getCurrentWorkspaceContext } from '$lib/currentworkspace.svelte';

const cloudWorkspaces = getWorkspacesContext();
const workspaces = $derived(cloudWorkspaces.workspaces);
const currentWorkspace = getCurrentWorkspaceContext();

async function deleteWorkspace(workspace: Workspace) {
  if (cloudWorkspaces.workspaces.length === 1) {
    return toast.error('There must exist at least one workspace', {
      description: 'This is the last workspace. Create another workspace in order to delete this one.',
    });
  }
  if (currentWorkspace.value?.id === workspace.id) {
    return toast.error('Cannot delete current workspace', {
      description: 'You first need to switch to another workspace',
    });
  }
  confirmDelete(workspace.name, async () => await cloudWorkspaces.delete(workspace.id));
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
    <div
      class="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1">
          <h1
            class="text-3xl font-bold tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            Your Workspaces
          </h1>
          <p class="text-muted-foreground">
            Manage your cloud workspaces and notes beautifully.
          </p>
        </div>
        <Button
          onclick={openNewWorkspace}
          class="gap-2 shadow-sm rounded-full px-6 transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <icons.Plus class="size-4" />
          New Workspace
        </Button>
      </div>

      {#if workspaces.length === 0}
        <div
          class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-primary/5 p-16 text-center mt-10 transition-all hover:bg-primary/10"
        >
          <div
            class="mx-auto flex size-24 items-center justify-center rounded-full bg-background text-primary border border-primary/10 shadow-sm mb-6 transition-transform hover:scale-110 duration-300"
          >
            <icons.FolderPlus class="size-10" />
          </div>
          <h2 class="text-2xl font-semibold mb-2">
            Create your first workspace
          </h2>
          <p class="text-muted-foreground mb-8 max-w-sm">
            Workspaces help you group and organize your notes seamlessly. Get
            started now.
          </p>
          <Button
            onclick={openNewWorkspace}
            size="lg"
            class="gap-2 rounded-full shadow-lg"
          >
            <icons.CirclePlus class="size-5" />
            Get Started
          </Button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each workspaces as workspace (workspace.id)}
            <Card.Root
              onclick={() => {
                currentWorkspace.value = workspace;
              }}
              class="group relative flex flex-col rounded-2xl bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card/75 hover:border-primary/30"
            >
              <Card.Header
                class="flex flex-row items-start justify-between pb-2"
              >
                <div
                  class="bg-linear-to-br from-primary/20 to-primary/5 flex size-14 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-110"
                >
                  <IconRenderer
                    class="size-8 text-primary text-3xl"
                    icon={workspace.icon || "lucide:Folder"}
                  />
                </div>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({
                      size: "icon",
                      variant: "ghost",
                      class: "z-100 m-0! -mr-2! -mt-2!",
                    })}
                  >
                    <icons.Ellipsis class="size-4 text-muted-foreground" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item
                      onclick={() => goto(`/workspace-${workspace.id}`)}
                    >
                      <icons.FolderOpen class="mr-2 size-4" />
                      Open
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      variant="destructive"
                      onclick={() => deleteWorkspace(workspace)}
                    >
                      <icons.Trash2 class="mr-2 size-4" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Card.Header>

              <Card.Content class="space-y-1 z-0 pb-6 pt-2">
                <Card.Title class="line-clamp-1 text-xl">
                  {workspace.name}
                </Card.Title>
                <Card.Description
                  class="flex items-center gap-1.5 opacity-80 text-xs"
                >
                  <icons.Clock class="size-3" />
                  Created at {timeAgo(workspace.created_at)}
                  <span>•</span>
                  <icons.Clock class="size-3" />
                  Updated at {timeAgo(workspace.updated_at)}
                </Card.Description>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
