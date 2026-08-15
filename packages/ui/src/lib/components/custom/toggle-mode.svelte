<script lang="ts">
import MoonStar from "@lucide/svelte/icons/moon-star";
import Sun from "@lucide/svelte/icons/sun";
import { toggleMode } from "mode-watcher";
import { Button } from "../ui/button";
import SimpleTooltip from "./simple-tooltip.svelte";

let { onclick }: { onclick?: () => void } = $props();
function handleClick() {
	onclick?.();
	toggleMode();
}
</script>

<SimpleTooltip content="Toggle Mode">
  <Button variant="ghost" size="icon" class="relative" onclick={handleClick}>
    <Sun
      class="scale-100 dark:scale-0 rotate-0 dark:rotate-180 transition-transform"
    />
    <MoonStar
      class="absolute dark:scale-100 scale-0 rotate-180 dark:rotate-0 transition-transform"
    />
  </Button>
</SimpleTooltip>
