<script lang="ts">
  import { Button } from "@nota/ui/shadcn/button/index.js";
  import { SidebarTrigger } from "@nota/ui/shadcn/sidebar/index.js";
  import { cn } from "@nota/ui/utils.ts";
  let { class: className }: { class: string } = $props();
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import { getKeyboardShortcut } from "#lib/utils.ts";
  import { SimpleToolTip } from "@nota/ui";
</script>

<div class={cn("flex items-center gap-2", className)}>
  <SimpleToolTip
    content="Toggle Sidebar"
    keyboard={getKeyboardShortcut("\\", true)}
  >
    <SidebarTrigger />
  </SimpleToolTip>
  <SimpleToolTip content="Back" keyboard={getKeyboardShortcut("←", true)}>
    <Button onclick={() => history.back()} variant="ghost" size="icon">
      <ArrowLeft />
    </Button>
  </SimpleToolTip>
  <SimpleToolTip content="Forward" keyboard={getKeyboardShortcut("→", true)}>
    <Button onclick={() => history.forward()} variant="ghost" size="icon">
      <ArrowRight />
    </Button>
  </SimpleToolTip>
</div>
