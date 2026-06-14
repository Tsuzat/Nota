<script lang="ts">
  import { IconRenderer, icons } from '@nota/ui/icons/index.js';
  import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
  import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
  import { getWorkspacesContext } from '@nota/client';
  import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { cn } from '@nota/ui/utils';

  const localWorkspaces = getLocalWorkspaces();
  const cloudWorkspaces = getWorkspacesContext();
  const currentWorkspace = getCurrentWorkspace();

  const activeWorkspace = $derived(currentWorkspace?.get());

  function switchWorkspace(workspace: any, type: 'local' | 'cloud') {
    currentWorkspace.set(workspace);
    const href = type === 'local' 
      ? resolve('/(local)/local-workspace-[id]', { id: workspace.id })
      : resolve('/(cloud)/workspace-[id]', { id: workspace.id });
    goto(href);
  }
</script>

{#if activeWorkspace}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="w-[calc(100%-1rem)] mx-2 my-1 flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent/80 transition-all text-left border border-sidebar-border/50 shadow-sm cursor-pointer select-none">
      <div class="flex items-center gap-2.5 min-w-0">
        <IconRenderer class="size-4 shrink-0 text-sidebar-foreground" icon={activeWorkspace.icon || 'lucide:Folder'} />
        <span class="truncate text-sidebar-foreground font-semibold">{activeWorkspace.name}</span>
      </div>
      <icons.ChevronDown class="size-4 shrink-0 text-sidebar-foreground/50" />
      
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-56" align="start">
      <DropdownMenu.Label class="text-xs text-muted-foreground font-semibold px-2 py-1.5">
        Local Workspaces
      </DropdownMenu.Label>
      {#each localWorkspaces.getWorkspaces() as ws (ws.id)}
        <DropdownMenu.Item 
          class={cn("flex items-center gap-2", activeWorkspace.id === ws.id && "bg-sidebar-accent text-sidebar-accent-foreground")}
          onclick={() => switchWorkspace(ws, 'local')}
        >
          <IconRenderer class="size-4" icon={ws.icon || 'lucide:Folder'} />
          <span class="truncate flex-1 font-medium">{ws.name}</span>
          {#if activeWorkspace.id === ws.id}
            <icons.Check class="size-4 text-primary" />
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
            class={cn("flex items-center gap-2", activeWorkspace.id === ws.id && "bg-sidebar-accent text-sidebar-accent-foreground")}
            onclick={() => switchWorkspace(ws, 'cloud')}
          >
            <IconRenderer class="size-4" icon={ws.icon || 'lucide:Folder'} />
            <span class="truncate flex-1 font-medium">{ws.name}</span>
            {#if activeWorkspace.id === ws.id}
              <icons.Check class="size-4 text-primary" />
            {/if}
          </DropdownMenu.Item>
        {/each}
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}

