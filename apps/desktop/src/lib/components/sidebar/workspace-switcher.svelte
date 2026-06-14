<script lang="ts">
  import { IconRenderer, icons } from '@nota/ui/icons/index.js';
  import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
  import * as Sidebar from '@nota/ui/shadcn/sidebar';
  import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
  import { getWorkspacesContext } from '@nota/client';
  import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { cn } from '@nota/ui/utils';
  import NewWorkspace from '../dialogs/new-workspace.svelte';

  const localWorkspaces = getLocalWorkspaces();
  const cloudWorkspaces = getWorkspacesContext();
  const currentWorkspace = getCurrentWorkspace();

  const activeWorkspace = $derived(currentWorkspace?.get());
  const isCloud = $derived(activeWorkspace && "owner" in activeWorkspace);

  let open = $state(false);

  function switchWorkspace(workspace: any, type: 'local' | 'cloud') {
    currentWorkspace.set(workspace);
    const href = type === 'local' 
      ? resolve('/(local)/local-workspace-[id]', { id: workspace.id })
      : resolve('/(cloud)/workspace-[id]', { id: workspace.id });
    goto(href);
  }
</script>

<NewWorkspace bind:open />

{#if activeWorkspace}
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Sidebar.MenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full select-none cursor-pointer"
              {...props}
            >
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <IconRenderer class="size-4 shrink-0 text-sidebar-primary-foreground" icon={activeWorkspace.icon || 'lucide:Folder'} />
              </div>
              <div class="flex flex-col gap-0.5 leading-none text-left min-w-0 flex-1">
                <span class="font-semibold truncate text-sidebar-foreground">{activeWorkspace.name}</span>
                <span class="text-xs text-muted-foreground">{isCloud ? 'Cloud Workspace' : 'Local Workspace'}</span>
              </div>
              <icons.ChevronsUpDown class="ms-auto size-4 shrink-0 text-muted-foreground" />
            </Sidebar.MenuButton>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width) min-w-56" align="start">
          <DropdownMenu.Label class="text-xs text-muted-foreground font-semibold px-2 py-1.5">
            Local Workspaces
          </DropdownMenu.Label>
          {#each localWorkspaces.getWorkspaces() as ws (ws.id)}
            <DropdownMenu.Item 
              class={cn("flex items-center gap-2 cursor-pointer", activeWorkspace.id === ws.id && "bg-sidebar-accent text-sidebar-accent-foreground")}
              onclick={() => switchWorkspace(ws, 'local')}
            >
              <IconRenderer class="size-4" icon={ws.icon || 'lucide:Folder'} />
              <span class="truncate flex-1 font-medium">{ws.name}</span>
              {#if activeWorkspace.id === ws.id}
                <icons.Check class="ms-auto size-4 text-primary" />
              {/if}
            </DropdownMenu.Item>
          {/each}

          {#if cloudWorkspaces.workspaces.length > 0}
            <DropdownMenu.Separator />
            <DropdownMenu.Label class="text-xs text-muted-foreground font-semibold px-2 py-1.5">
              Cloud Workspaces
            </DropdownMenu.Label>
            {#each cloudWorkspaces.workspaces as ws (ws.id)}
              <DropdownMenu.Item 
                class={cn("flex items-center gap-2 cursor-pointer", activeWorkspace.id === ws.id && "bg-sidebar-accent text-sidebar-accent-foreground")}
                onclick={() => switchWorkspace(ws, 'cloud')}
              >
                <IconRenderer class="size-4" icon={ws.icon || 'lucide:Folder'} />
                <span class="truncate flex-1 font-medium">{ws.name}</span>
                {#if activeWorkspace.id === ws.id}
                  <icons.Check class="ms-auto size-4 text-primary" />
                {/if}
              </DropdownMenu.Item>
            {/each}
          {/if}

          <DropdownMenu.Separator />
          <DropdownMenu.Item class="flex items-center gap-2 cursor-pointer" onclick={() => (open = true)}>
            <icons.Plus class="size-4 text-muted-foreground" />
            <span class="font-medium text-muted-foreground">Add New Workspace</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{/if}
