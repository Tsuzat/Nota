<script lang="ts">
  import {
    type Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    Root as SidebarRoot,
  } from "@nota/ui/shadcn/sidebar";
  import type { ComponentProps } from "svelte";
  import { ISMACOS } from "$lib/utils";
  import AppLogoMenu from "../app-menu.svelte";
  import BackAndForthButtons from "../back-and-forth-buttons.svelte";
  import NavMain from "./nav-main.svelte";
  import NavNotes from "./nav-notes.svelte";
  import NavPinned from "./nav-pinned.svelte";
  import NavShared from "./nav-shared.svelte";
  import NavSecondary from "./nav-secondary.svelte";
  import WorkspaceSwitcher from "./workspace-switcher.svelte";

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> =
    $props();
</script>

<SidebarRoot bind:ref variant="sidebar" {...restProps}>
  <SidebarHeader class="border-b border-b-border/50">
    <div data-tauri-drag-region class="flex items-center justify-between">
      {#if !ISMACOS}
        <AppLogoMenu />
      {/if}
      <BackAndForthButtons class="ml-auto" />
    </div>
    <WorkspaceSwitcher />
    <NavMain />
  </SidebarHeader>
  <SidebarContent>
    <NavShared />
    <NavPinned />
    <NavNotes />
  </SidebarContent>
  <SidebarFooter class="p-0 border-t border-t-border/50">
    <NavSecondary />
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
