<script lang="ts">
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { icons } from "@nota/ui/icons/index.js";
  import { Button } from "@nota/ui/shadcn/button";
  import { SidebarTrigger } from "@nota/ui/shadcn/sidebar";
  import { getKeyboardShortcut} from "$lib/utils";
  import { cn } from "@lib/utils";
  interface Props {
    class?: string
  }
  const {class: className}: Props = $props()
</script>

<div class={cn("flex items-center gap-1 z-500!", className)}>
  <SimpleToolTip content="Toggle Sidebar" keyboard={getKeyboardShortcut("\\", true)} >
    <SidebarTrigger /> 
  </SimpleToolTip>
  <SimpleToolTip content="Go Back" keyboard={getKeyboardShortcut("←", true)}>
    <Button variant="ghost" size="icon" onclick={() => history.back()}>
      <icons.ArrowLeft />
    </Button>
  </SimpleToolTip>
  <SimpleToolTip content="Go Next" keyboard={getKeyboardShortcut("→", true)}>
    <Button variant="ghost" size="icon" onclick={() => history.forward()}>
      <icons.ArrowRight />
    </Button>
  </SimpleToolTip>
</div>
