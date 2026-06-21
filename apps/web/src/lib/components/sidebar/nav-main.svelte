<script lang="ts">
  import { MovingHome, MovingSearch } from "@nota/ui/icons/index.js";
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { openGlobalSearch } from "../global-search.svelte";

  let isHomeHovered = $state(false);
  let isSearchHovered = $state(false);
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      onclick={() => goto(resolve("/home"))}
      onmouseenter={() => (isHomeHovered = true)}
      onmouseleave={() => (isHomeHovered = false)}
    >
      <MovingHome size={18} isHovered={isHomeHovered} />
      <span>Home</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton
      onclick={openGlobalSearch}
      onmouseenter={() => (isSearchHovered = true)}
      onmouseleave={() => (isSearchHovered = false)}
    >
      <MovingSearch size={18} isHovered={isSearchHovered} />
      <span>Search Anything</span>
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
