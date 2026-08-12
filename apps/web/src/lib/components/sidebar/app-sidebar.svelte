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
import NavSecondary from './nav-secondary.svelte';
import NavShared from './nav-shared.svelte';
import WorkspaceSwitcher from './workspace-switcher.svelte';

let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();
</script>

<SidebarRoot bind:ref variant="floating" {...restProps}>
  <SidebarHeader class="border-b border-b-border/50">
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
