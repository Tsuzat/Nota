<script lang="ts">
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { icons } from "@nota/ui/icons/index.js";
  import { Button } from "@nota/ui/shadcn/button";
  import { SidebarTrigger } from "@nota/ui/shadcn/sidebar";
  import { getKeyboardShortcut, ISWINDOWS } from "$lib/utils";
  import { cn } from "@lib/utils";
  import AppLogoMenu from "./app-menu.svelte";
  import { Separator } from "@nota/ui/shadcn/separator";
  import { fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  interface Props {
    class?: string;
    showAppMenu?: boolean;
    showSeparator?: boolean;
  }
  const { class: className, showAppMenu = false, showSeparator = false }: Props = $props();
</script>

<div
  class={cn("flex items-center gap-1 z-500!", className)}
  in:fly={{ x: -16, duration: 200, easing: cubicOut }}
  out:fly={{ x: -16, duration: 150, easing: cubicOut }}
>
  {#if showAppMenu && ISWINDOWS}
    <AppLogoMenu />
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
  {#if showSeparator}
    <Separator orientation="vertical" class="h-4 mx-1" />
  {/if}
</div>
