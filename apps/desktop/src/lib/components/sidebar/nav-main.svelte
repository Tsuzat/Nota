<script lang="ts">
import { MovingHome, MovingSearch, MovingStorage, MovingVersion } from '@nota/ui/icons/index.js';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { getKeyboardShortcut } from '$lib/utils';
import { openGlobalSearch } from '../global-search';

let isHomeHovered = $state(false);
let isSearchHovered = $state(false);
let isStorageHovered = $state(false);
let isVersionsHovered = $state(false);
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
      class="mt-1"
      isActive={page.url.pathname.endsWith("/")}
      onclick={() => goto(resolve("/"))}
      onmouseenter={() => (isHomeHovered = true)}
      onmouseleave={() => (isHomeHovered = false)}
    >
      <MovingHome size={18} isHovered={isHomeHovered} />
      <span>Home</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      class="mt-1"
      isActive={page.url.pathname.startsWith("/storage")}
      onclick={() => goto(resolve("/storage"))}
      onmouseenter={() => (isStorageHovered = true)}
      onmouseleave={() => (isStorageHovered = false)}
    >
      <MovingStorage size={18} animate={isStorageHovered} />
      <span>Storage</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      class="mt-1"
      isActive={page.url.pathname.startsWith("/versions")}
      onclick={() => goto(resolve("/versions"))}
      onmouseenter={() => (isVersionsHovered = true)}
      onmouseleave={() => (isVersionsHovered = false)}
    >
      <MovingVersion size={18} animate={isVersionsHovered} />
      <span>Versions</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
