<script lang="ts">
import { SidebarTrigger, useSidebar } from "@nota/ui/shadcn/sidebar/index.ts";
import { cn } from "@nota/ui/utils";
import type { Snippet } from "svelte";
import { ISDESKTOP } from "#lib/utils.ts";
import ToggleSidebar from "./toggle-sidebar.svelte";

interface Props {
	left?: Snippet<[]>;
	right?: Snippet<[]>;
	center?: Snippet<[]>;
	class?: string;
}
const { left, right, center, class: className }: Props = $props();
</script>

<header
  data-tauri-drag-region
  class={cn("h-12 min-h-12 flex w-full justify-between px-2", className)}
>
  <div class="flex items-center gap-2">
    {#if !ISDESKTOP}
      <SidebarTrigger />
    {:else}
      <ToggleSidebar class={cn(useSidebar().open ? "hidden" : "ml-20")} />
    {/if}
    {@render left?.()}
  </div>
  {@render center?.()}
  {@render right?.()}
</header>
