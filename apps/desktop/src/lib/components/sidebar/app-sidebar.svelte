<script lang="ts">
  import {
    type Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    Root as SidebarRoot,
  } from "@nota/ui/shadcn/sidebar";
  import { type ComponentProps,  } from "svelte";
  import { ISMACOS } from "$lib/utils";
  import AppLogoMenu from "../app-menu.svelte";
  import NavFavorites from "./nav-favorites.svelte";
  import NavMain from "./nav-main.svelte";
  import NavSecondary from "./nav-secondary.svelte";
  import WorkspaceSwitcher from "./workspace-switcher.svelte";
  import NavNotes from "./nav-notes.svelte";
  import BackAndForthButtons from "../back-and-forth-buttons.svelte";

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> =
    $props(); 
</script>

<SidebarRoot bind:ref variant="sidebar" {...restProps}>
  <SidebarHeader>
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
    <NavFavorites />
    <NavNotes />
  </SidebarContent>
  <SidebarFooter class="p-0">
    <NavSecondary />
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
