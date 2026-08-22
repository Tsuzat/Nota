<script lang="ts">
import ChevronUpDown from "@lucide/svelte/icons/chevrons-up-down";
import CirclePlus from "@lucide/svelte/icons/circle-plus";
import { toast } from "@nota/ui";
import { IconsRenderer } from "@nota/ui/icons/index.js";
import { buttonVariants } from "@nota/ui/shadcn/button/index.js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@nota/ui/shadcn/dropdown-menu/index.ts";
import {
	SidebarMenuButton,
	SidebarTrigger,
} from "@nota/ui/shadcn/sidebar/index.ts";
import { cn } from "@nota/ui/utils";
import type { Workspace } from "#lib/data/types.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { ISDESKTOP } from "#lib/utils.ts";
import { openCreateWorkspace } from "../dialogs";

const workspaceCxt = getWorkspaceContext();
const currentWorkspace = $derived(workspaceCxt.current);
const isCloud = $derived("ownerId" in (currentWorkspace ?? {}));

const switchWorkspace = (workspace: Workspace) => {
	if (workspaceCxt.current?.id === workspace.id) {
		return toast.info("You are already in this workspace.");
	}
	workspaceCxt.current = workspace;
};
</script>

<div class="flex items-center gap-1!">
  <SidebarMenuButton
    size="lg"
    class={cn(
      "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full select-none cursor-pointer",
      ISDESKTOP && "hover:bg-foreground/10 ",
    )}
    onclick={() => {
      // goto(href);
    }}
  >
    <div
      class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
    >
      <IconsRenderer
        class="text-xl"
        icon={currentWorkspace?.icon || "lucide:Folder"}
      />
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
      class={buttonVariants({
        variant: "ghost",
        class: cn("h-full", ISDESKTOP && "hover:bg-foreground/10!"),
      })}
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
          <DropdownMenuItem onclick={() => switchWorkspace(workspace)}>
            <IconsRenderer icon={workspace.icon} />
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
          <DropdownMenuItem onclick={() => switchWorkspace(workspace)}>
            <IconsRenderer icon={workspace.icon ?? "lucide:Folder"} />
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
