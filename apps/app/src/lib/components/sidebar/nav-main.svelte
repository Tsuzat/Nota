<script lang="ts">
import { SimpleToolTip } from "@nota/ui";
import {
	MovingHome,
	MovingSearch,
	MovingStorage,
	MovingVersion,
} from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { cn } from "@nota/ui/utils.ts";
import { getKeyboardShortcut } from "#lib/utils.ts";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";

let isHomeHovered = $state(false);
let isSearchHovered = $state(false);
let isStorageHovered = $state(false);
let isVersionsHovered = $state(false);

const isHomeActive = $derived(page.url.pathname === resolve("/"));
const isStorageActive = $derived(
	page.url.pathname.startsWith(resolve("/storage")),
);
const isVersionsActive = $derived(
	page.url.pathname.startsWith(resolve("/versions")),
);
</script>

<div class="flex items-center justify-around w-full">
  <SimpleToolTip
    content="Search"
    keyboard={getKeyboardShortcut("K", true)}
    side="bottom"
  >
    <Button
      variant="outline"
      size="icon-lg"
      onmouseenter={() => (isSearchHovered = true)}
      onmouseleave={() => (isSearchHovered = false)}
    >
      <MovingSearch size={18} isHovered={isSearchHovered} />
    </Button>
  </SimpleToolTip>

  <SimpleToolTip content="Home" side="bottom">
    <Button
      variant="outline"
      size="icon-lg"
      class={cn(
        isHomeActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      )}
      onclick={() => goto(resolve("/"))}
      onmouseenter={() => (isHomeHovered = true)}
      onmouseleave={() => (isHomeHovered = false)}
    >
      <MovingHome size={18} isHovered={isHomeHovered} />
    </Button>
  </SimpleToolTip>

  <SimpleToolTip content="Storage" side="bottom">
    <Button
      variant="outline"
      size="icon-lg"
      class={cn(
        isStorageActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      )}
      onclick={() => goto(resolve("/storage"))}
      onmouseenter={() => (isStorageHovered = true)}
      onmouseleave={() => (isStorageHovered = false)}
    >
      <MovingStorage size={18} animate={isStorageHovered} />
    </Button>
  </SimpleToolTip>

  <SimpleToolTip content="Versions" side="bottom">
    <Button
      variant="outline"
      size="icon-lg"
      class={cn(
        isVersionsActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      )}
      href={resolve("/versions")}
      onmouseenter={() => (isVersionsHovered = true)}
      onmouseleave={() => (isVersionsHovered = false)}
    >
      <MovingVersion size={18} animate={isVersionsHovered} />
    </Button>
  </SimpleToolTip>
</div>
