<script lang="ts">
import { getKeyboardShortcut } from '@lib/components/edra';
import Button from '@lib/components/ui/button/button.svelte';
import { Kbd } from '@lib/components/ui/kbd';
import { toast } from '@lib/components/ui/sonner';
import { getWorkspacesContext, type Workspace } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { cn } from '@nota/ui/utils';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import { openNewWorkspace } from '../dialogs/new-workspace.svelte';

const cloudWorkspaces = getWorkspacesContext();
const currentWorkspaceCtx = getCurrentWorkspace();
const activeWorkspace = $derived(currentWorkspaceCtx.get());

const href = $derived.by(() => {
  if (!activeWorkspace) return '';
  return resolve('/(app)/workspace-[id]', { id: activeWorkspace.id });
});

function switchWorkspace(workspace: Workspace) {
  if (activeWorkspace?.id === workspace.id) {
    return toast.info('Already in this workspace.');
  }
  currentWorkspaceCtx.set(workspace);
  const targetHref = resolve('/(app)/workspace-[id]', { id: workspace.id });
  goto(targetHref);
}
</script>

{#if activeWorkspace}
  <div class="flex items-center gap-1!">
    <Sidebar.MenuButton
      size="lg"
      class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full select-none cursor-pointer"
      onclick={() => {
        if (href) goto(href);
      }}
    >
      <div
        class="bg-sidebar-primary/25 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
      >
        <IconRenderer
          class="size-4 shrink-0 text-sidebar-primary-foreground"
          icon={activeWorkspace.icon}
        />
      </div>
      <div class="flex flex-col gap-0.5 leading-none text-left min-w-0 flex-1">
        <span class="font-semibold truncate text-sidebar-foreground"
          >{activeWorkspace.name}</span
        >
      </div>
    </Sidebar.MenuButton>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="ghost" class="h-full">
            <icons.ChevronsUpDown />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56"
        align="start"
      >
        <DropdownMenu.Group>
          <DropdownMenu.GroupHeading>Select Workspace</DropdownMenu.GroupHeading
          >
          {#each cloudWorkspaces.workspaces as ws (ws.id)}
            <DropdownMenu.Item
              class={cn(
                "flex items-center gap-2 cursor-pointer",
                activeWorkspace?.id === ws.id &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
              onclick={() => switchWorkspace(ws)}
            >
              <IconRenderer class="size-4" icon={ws.icon || "lucide:Folder"} />
              <span class="truncate flex-1 font-medium">{ws.name}</span>
              {#if activeWorkspace?.id === ws.id}
                <icons.Check class="ms-auto size-4 text-primary" />
              {/if}
            </DropdownMenu.Item>
          {/each}

          <DropdownMenu.Separator />
          <DropdownMenu.Item
            class="flex items-center gap-2 cursor-pointer"
            onclick={openNewWorkspace}
          >
            <icons.CirclePlus class="size-4 text-muted-foreground" />
            <span class="font-medium text-muted-foreground"
              >Create Workspace</span
            >
            <Kbd>{getKeyboardShortcut("W", true)}</Kbd>
          </DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
{/if}
