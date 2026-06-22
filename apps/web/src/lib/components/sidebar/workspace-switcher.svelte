<script lang="ts">
import { getWorkspacesContext, type Workspace } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { buttonVariants } from '@nota/ui/shadcn/button';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { cn } from '@nota/ui/utils';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { getCurrentWorkspaceContext } from '$lib/currentworkspace.svelte';
import { openNewWorkspace } from '../dialogs/new-workspace.svelte';

const cloudWorkspaces = getWorkspacesContext();

const currentWorkspace = getCurrentWorkspaceContext();

function switchWorkspace(workspace: Workspace) {
  currentWorkspace.value = workspace;
  goto(resolve('/(app)/workspace-[id]', { id: workspace.id }));
}
</script>

{#if currentWorkspace.value !== undefined}
  {@const activeWorkspace = currentWorkspace.value}
  <div class="flex items-center gap-1!">
    <Sidebar.MenuButton
      size="lg"
      class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full select-none cursor-pointer"
      onclick={() => {
        goto(resolve("/(app)/workspace-[id]", { id: activeWorkspace.id }));
      }}
    >
      <div
        class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
      >
        <IconRenderer
          class="size-4 shrink-0 text-sidebar-primary-foreground"
          icon={activeWorkspace.icon || "lucide:Folder"}
        />
      </div>
      <div class="flex flex-col gap-0.5 leading-none text-left min-w-0 flex-1">
        <span class="font-semibold truncate text-sidebar-foreground"
          >{activeWorkspace.name}</span
        >
        <span class="text-[10px] text-muted-foreground">Workspace</span>
      </div>
    </Sidebar.MenuButton>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class={buttonVariants({ variant: "ghost", class: "h-full" })}
      >
        <icons.ChevronsUpDown class="size-4 text-muted-foreground" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56"
        align="start"
      >
        {#if cloudWorkspaces.workspaces.length > 0}
          <DropdownMenu.Label
            class="text-xs text-muted-foreground font-semibold px-2 py-1.5"
          >
            Workspaces
          </DropdownMenu.Label>
          {#each cloudWorkspaces.workspaces as ws (ws.id)}
            {@const isActive = activeWorkspace.id === ws.id}
            <DropdownMenu.Item
              class={cn(
                "flex items-center gap-2 cursor-pointer my-0.25",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
              onclick={() => switchWorkspace(ws)}
            >
              <IconRenderer class="size-4" icon={ws.icon || "lucide:Folder"} />
              <span class="truncate flex-1 font-medium text-sm">{ws.name}</span>
              {#if isActive}
                <icons.Check class="ms-auto size-4 text-primary" />
              {/if}
            </DropdownMenu.Item>
          {/each}
        {/if}

        <DropdownMenu.Separator />
        <DropdownMenu.Item
          class="flex items-center gap-2 cursor-pointer"
          onclick={openNewWorkspace}
        >
          <icons.CirclePlus class="size-4 text-muted-foreground" />
          <span class="font-medium text-muted-foreground text-sm"
            >Create Workspace</span
          >
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
{/if}
