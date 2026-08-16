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
import WorkspaceSwitcher from "./workspace-switcher.svelte";

//   import AppLogoMenu from "../app-menu.svelte";
//   import BackAndForthButtons from "../back-and-forth-buttons.svelte";
//   import NavMain from "./nav-main.svelte";
//   import NavNotes from "./nav-notes.svelte";
//   import NavPinned from "./nav-pinned.svelte";
//   import NavSecondary from "./nav-secondary.svelte";
//   import NavShared from "./nav-shared.svelte";
//   import WorkspaceSwitcher from "./workspace-switcher.svelte";

let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> =
	$props();
</script>

<SidebarRoot
  bind:ref
  variant={ISDESKTOP ? "inset" : "floating"}
  {...restProps}
  class="p-1!"
>
  <SidebarHeader
    data-tauri-drag-region
    class="border-b z-100 border-b-border/50 bg-transparent!"
  >
    <div
      data-tauri-drag-region
      class="flex h-8 z-0 items-center justify-between"
    >
      {#if !ISMACOS}
        <AppLogoMenu />
      {/if}
      <ToggleSidebar class="ml-auto" />
    </div>
    <WorkspaceSwitcher />
    <!-- <NavMain /> -->
  </SidebarHeader>
  <SidebarContent>
    <!-- <NavShared />
    <NavPinned />
    <NavNotes /> -->
  </SidebarContent>
  <SidebarFooter class="p-0 border-t border-t-border/50">
    <!-- <NavSecondary /> -->
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
