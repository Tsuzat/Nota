<script lang="ts">
import ProBadge from '@lib/components/custom/ProBadge.svelte';
import { getKeyboardShortcut } from '@lib/components/edra';
import { cn } from '@lib/utils';
import { MovingHome, MovingSearch, MovingStorage, MovingVersion } from '@nota/ui/icons/index.js';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { openGlobalSearch } from './global-search';

let isHomeHovered = $state(false);
let isSearchHovered = $state(false);
let isStorageHovered = $state(false);
let isVersionHovered = $state(false);
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      class="border p-2"
      onclick={openGlobalSearch}
      onmouseenter={() => (isSearchHovered = true)}
      onmouseleave={() => (isSearchHovered = false)}
    >
      <MovingSearch size={18} isHovered={isSearchHovered} />
      <span>Search</span>
      <Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded-md p-1">
        {getKeyboardShortcut("K", true)}
      </Sidebar.MenuBadge>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      class={cn("mt-1", page.url.pathname.includes("/home") && "bg-muted")}
      onclick={() => goto(resolve("/(app)/home"))}
      onmouseenter={() => (isHomeHovered = true)}
      onmouseleave={() => (isHomeHovered = false)}
    >
      <MovingHome size={18} isHovered={isHomeHovered} />
      <span>Home</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      class={cn("mt-1", page.url.pathname.includes("/storage") && "bg-muted")}
      onclick={() => goto(resolve("/(app)/storage"))}
      onmouseenter={() => (isStorageHovered = true)}
      onmouseleave={() => (isStorageHovered = false)}
    >
      <MovingStorage size={18} animate={isStorageHovered} />
      <span>Storage</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      class={cn("mt-1", page.url.pathname.includes("/versions") && "bg-muted")}
      onclick={() => goto(resolve("/(app)/versions"))}
      onmouseenter={() => (isVersionHovered = true)}
      onmouseleave={() => (isVersionHovered = false)}
    >
      <MovingVersion size={18} animate={isVersionHovered} />
      <span>Versions</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
