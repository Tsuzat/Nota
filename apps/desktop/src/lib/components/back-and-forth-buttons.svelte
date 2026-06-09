<script lang="ts">
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { icons } from "@nota/ui/icons/index.js";
  import { Button } from "@nota/ui/shadcn/button";
  import { SidebarTrigger } from "@nota/ui/shadcn/sidebar";
  import { getKeyboardShortcut, ISMACOS, ISWINDOWS } from "$lib/utils";
  import AppMenu from "./app-menu.svelte";
</script>

<div class:ml-24={ISMACOS}  class="flex items-center gap-1 ml-4">
{#if ISWINDOWS}
  <AppMenu />
  <small>Nota</small>
{/if}
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
