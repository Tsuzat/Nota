<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { cn } from "#lib/utils.js";
  import { useSidebar } from "./context.svelte.js";
  import type { ComponentProps } from "svelte";
  import { Tooltip, TooltipTrigger, TooltipContent } from "../tooltip/index.js";

  let {
    ref = $bindable(null),
    class: className,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sidebar = useSidebar();
</script>

<Button
  bind:ref
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  variant="ghost"
  size="icon"
  class={cn("cn-sidebar-trigger", className)}
  type="button"
  onclick={(e: MouseEvent) => {
    onclick?.(e);
    sidebar.toggle();
  }}
  {...restProps}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M4.75 4h14.5A2.755 2.755 0 0 1 22 6.75v10.5A2.755 2.755 0 0 1 19.25 20H4.75A2.755 2.755 0 0 1 2 17.25V6.75A2.755 2.755 0 0 1 4.75 4M3.5 6.75v10.5c0 .69.56 1.25 1.25 1.25H8.5v-13H4.75c-.69 0-1.25.56-1.25 1.25M19.25 18.5c.69 0 1.25-.56 1.25-1.25V6.75c0-.69-.56-1.25-1.25-1.25H10v13zM5 7h2v1.5H5zm2 3H5v1.5h2zm-2 3h2v1.5H5z"
      clip-rule="evenodd"
    />
  </svg>
  <span class="sr-only">Toggle Sidebar</span>
</Button>
