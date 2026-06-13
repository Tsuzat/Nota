<script lang="ts">
  import {
    type Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    Root as SidebarRoot,
    SidebarTrigger,
  } from "@nota/ui/shadcn/sidebar";
  import { type ComponentProps, onMount } from "svelte";
  import { APPWINDOW } from "$lib/contants";
  import { ISMACOS } from "$lib/utils";
  import AppLogoMenu from "../app-menu.svelte";
  import { useCurrentUserWorkspaceContext } from "../user-workspace/userworkspace.svelte";
  import NavFavorites from "./nav-favorites.svelte";
  import NavMain from "./nav-main.svelte";
  import NavSecondary from "./nav-secondary.svelte";
  import NavWorkspacesCloud from "./nav-workspaces-cloud.svelte";
  import NavWorkspacesLocal from "./nav-workspaces-local.svelte";
  import UserworkspaceSwitcher from "./userworkspace-switcher.svelte";
  import BackAndForthButtons from "../back-and-forth-buttons.svelte";

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> =
    $props();
  const currentUserWorkspace = $derived(useCurrentUserWorkspaceContext());

  let IS_MAXIMUM = $state(false);

  onMount(async () => {
    IS_MAXIMUM = await APPWINDOW.isFullscreen();
    APPWINDOW.listen("tauri://resize", async () => {
      IS_MAXIMUM = await APPWINDOW.isFullscreen();
    });
  });
</script>

<SidebarRoot bind:ref variant="sidebar" {...restProps}>
  <SidebarHeader>
    <div data-tauri-drag-region class="flex items-center justify-between">
      {#if !ISMACOS}
        <AppLogoMenu />
      {/if}
      <BackAndForthButtons class="ml-auto" />
    </div>
    <UserworkspaceSwitcher />
    <NavMain />
  </SidebarHeader>
  <SidebarContent>
    <NavFavorites />
    {#if currentUserWorkspace.getIsLocal()}
      <NavWorkspacesLocal />
    {/if}
    {#if !currentUserWorkspace.getIsLocal()}
      <NavWorkspacesCloud />
    {/if}
  </SidebarContent>
  <SidebarFooter class="p-0">
    <NavSecondary />
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
