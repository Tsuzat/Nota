<script lang="ts">
  import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
  import { SidebarMenuButton } from "@nota/ui/shadcn/sidebar/index.ts";
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
  } from "@nota/ui/shadcn/dropdown-menu/index.ts";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.js";
  import ChevronUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import CirclePlus from "@lucide/svelte/icons/circle-plus";
  import { openCreateWorkspace } from "../dialogs";

  const workspaceCxt = getWorkspaceContext();
  const currentWorkspace = $derived(workspaceCxt.current);
  const isCloud = $derived("ownerId" in (currentWorkspace ?? {}));
</script>

<div class="flex items-center gap-1!">
  <SidebarMenuButton
    size="lg"
    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full select-none cursor-pointer"
    onclick={() => {
      // goto(href);
    }}
  >
    <div
      class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
    >
      <!-- <IconRenderer
        class="size-4 shrink-0 text-sidebar-primary-foreground"
        icon={activeWorkspace.icon || "lucide:Folder"}
      /> -->
    </div>
    <div class="flex flex-col gap-0.5 leading-none text-left min-w-0 flex-1">
      <span class="font-semibold truncate text-sidebar-foreground"
        >{currentWorkspace?.name ?? "Switch Workspace"}</span
      >
      <span class="text-xs text-muted-foreground"
        >{isCloud ? "Cloud Workspace" : "Local Workspace"}</span
      >
    </div>
  </SidebarMenuButton>
  <DropdownMenu>
    <DropdownMenuTrigger
      class={buttonVariants({ variant: "ghost", class: "h-full" })}
    >
      <ChevronUpDown />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      class="w-(--bits-dropdown-menu-anchor-width) min-w-56"
      align="start"
    >
      {@const localWorkspaces = workspaceCxt.local.workspaces}
      {#if localWorkspaces.length > 0}
        <DropdownMenuLabel
          class="text-xs text-muted-foreground font-semibold px-2 py-1.5"
        >
          Local Workspaces
        </DropdownMenuLabel>
        {#each localWorkspaces as workspace (workspace.id)}
          <DropdownMenuItem>
            {workspace.name}
          </DropdownMenuItem>
        {/each}
        <DropdownMenuSeparator />
      {/if}
      {@const cloudWorkspaces = workspaceCxt.cloud.workspaces}
      {#if cloudWorkspaces.length > 0}
        <DropdownMenuLabel
          class="text-xs text-muted-foreground font-semibold px-2 py-1.5"
        >
          Cloud Workspaces
        </DropdownMenuLabel>
        {#each cloudWorkspaces as workspace (workspace.id)}
          <DropdownMenuItem>
            {workspace.name}
          </DropdownMenuItem>
        {/each}
        <DropdownMenuSeparator />
      {/if}
      <DropdownMenuItem onclick={openCreateWorkspace}>
        <CirclePlus />
        Create New Workspace
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
