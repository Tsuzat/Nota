<script lang="ts">
  import { Button } from "@nota/ui/shadcn/button/index.js";
  import { SidebarTrigger } from "@nota/ui/shadcn/sidebar/index.js";
  import { cn } from "@nota/ui/utils.ts";
  let { class: className }: { class: string } = $props();
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import { SimpleTooltip } from ".";
  import { getKeyboardShortcut } from "#lib/utils.ts";
</script>

<div class={cn("flex items-center gap-2", className)}>
  <SimpleTooltip
    content="Toggle Sidebar"
    keyboard={getKeyboardShortcut("\\", true)}
  >
    <SidebarTrigger />
  </SimpleTooltip>
  <SimpleTooltip content="Back" keyboard={getKeyboardShortcut("←", true)}>
    <Button onclick={() => history.back()} variant="ghost" size="icon">
      <ArrowLeft />
    </Button>
  </SimpleTooltip>
  <SimpleTooltip content="Forward" keyboard={getKeyboardShortcut("→", true)}>
    <Button onclick={() => history.forward()} variant="ghost" size="icon">
      <ArrowRight />
    </Button>
  </SimpleTooltip>
</div>
