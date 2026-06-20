<script lang="ts">
import {
  type Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  Root as SidebarRoot,
} from '@nota/ui/shadcn/sidebar';
import type { ComponentProps } from 'svelte';
import NavMain from './nav-main.svelte';
import NavNotes from './nav-notes.svelte';
import NavPinned from './nav-pinned.svelte';
import NavUser from './nav-user.svelte';
import WorkspaceSwitcher from './workspace-switcher.svelte';

let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();
</script>

<SidebarRoot bind:ref variant="sidebar" {...restProps}>
  <SidebarHeader>
    <WorkspaceSwitcher />
    <NavMain />
  </SidebarHeader>
  <SidebarContent>
    <NavPinned />
    <NavNotes />
  </SidebarContent>
  <SidebarFooter class="p-0">
    <NavUser />
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
