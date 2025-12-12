<script lang="ts">
  import { Button } from "@lib/components/ui/button";
  import Sun from "@lucide/svelte/icons/sun";
  import MoonStar from "@lucide/svelte/icons/moon";
  import { mode, toggleMode } from "mode-watcher";
  import SimpleToolTip from "./SimpleToolTip.svelte";
</script>

<SimpleToolTip content="Toggle Mode">
  <Button onclick={toggleMode} variant="ghost" size="icon">
    <MoonStar class="dark:flex hidden" />
    <Sun class="flex dark:hidden" />
  </Button>
</SimpleToolTip>
