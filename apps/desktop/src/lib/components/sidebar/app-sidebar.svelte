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
import { getLocalNotes } from '$lib/local/notes.svelte';
import { ISMACOS } from '$lib/utils';
import AppLogoMenu from '../app-menu.svelte';
import BackAndForthButtons from '../back-and-forth-buttons.svelte';
import NavMain from './nav-main.svelte';
import NavNotes from './nav-notes.svelte';
import NavPinned from './nav-pinned.svelte';
import NavSecondary from './nav-secondary.svelte';
import WorkspaceSwitcher from './workspace-switcher.svelte';

let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar> = $props();

const currentWorkspace = $derived(getCurrentWorkspace().get());
const localNotes = getLocalNotes();
const cloudNotes = getNotesContext();
const notes = $derived.by(() => {
  if (!currentWorkspace) return [];
  if ('owner' in currentWorkspace) return cloudNotes.notes;
  return localNotes.getNotes();
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
    <WorkspaceSwitcher />
    <NavMain />
  </SidebarHeader>
  <SidebarContent>
    <NavPinned  />
    <NavNotes  />
  </SidebarContent>
  <SidebarFooter class="p-0">
    <NavSecondary />
  </SidebarFooter>
  <SidebarRail />
</SidebarRoot>
