<script lang="ts">
import {
	type Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
	Root as SidebarRoot,
} from "@nota/ui/shadcn/sidebar/index.ts";
import type { ComponentProps } from "svelte";
import { ISDESKTOP, ISMACOS } from "#lib/utils.ts";
import { AppLogoMenu } from "../custom";
import ToggleSidebar from "../custom/toggle-sidebar.svelte";
import NavMain from "./nav-main.svelte";
import NavNotes from "./nav-notes.svelte";
import NavSecondary from "./nav-secondary.svelte";
import SharedNotes from "./shared-notes.svelte";
import StarredNotes from "./starred-notes.svelte";
import WorkspaceSwitcher from "./workspace-switcher.svelte";

let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> =
	$props();
</script>

<SidebarRoot bind:ref variant="inset" {...restProps}>
  <SidebarHeader
    data-tauri-drag-region
    class="border-b z-100 border-b-border/50 bg-transparent!"
  >
    {#if ISDESKTOP}
      <div
        data-tauri-drag-region
        class="flex h-8 z-0 items-center justify-between"
      >
        {#if ISDESKTOP && !ISMACOS()}
          <AppLogoMenu />
        {/if}
        <ToggleSidebar class="ml-auto" />
      </div>
    {/if}
    <WorkspaceSwitcher />
    <NavMain />
  </SidebarHeader>
  <SidebarContent>
    <SharedNotes />
    <StarredNotes />
    <NavNotes />
  </SidebarContent>
  <SidebarFooter class="p-0 border-t border-t-border/50">
    <NavSecondary />
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
