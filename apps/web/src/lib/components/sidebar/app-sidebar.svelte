<script lang="ts">
import { getNotesContext } from '@nota/client';
import {
  type Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  Root as SidebarRoot,
} from '@nota/ui/shadcn/sidebar';
import type { ComponentProps } from 'svelte';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import NavMain from './nav-main.svelte';
import NavNotes from './nav-notes.svelte';
import NavPinned from './nav-pinned.svelte';
import NavSecondary from './nav-secondary.svelte';
import WorkspaceSwitcher from './workspace-switcher.svelte';

let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();

const currentWorkspaceCtx = getCurrentWorkspace();
const currentWorkspace = $derived(currentWorkspaceCtx.get());
const cloudNotes = getNotesContext();
const notes = $derived.by(() => {
  if (!currentWorkspace) return [];
  return cloudNotes.notes;
});
</script>

<SidebarRoot bind:ref variant="floating" {...restProps}>
  <SidebarHeader class="border-b border-b-border/50">
    <WorkspaceSwitcher />
    <NavMain />
  </SidebarHeader>
  <SidebarContent>
    <NavPinned />
    <NavNotes />
  </SidebarContent>
  <SidebarFooter class="p-0 border-t border-t-border/50">
    <NavSecondary />
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
