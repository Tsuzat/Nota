<script lang="ts">
  import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
  import type { Snippet } from "svelte";

  interface Props {
    content?: string;
    keyboard?: string;
    children: Snippet<[]>;
    child?: Snippet<[]>;
    delayDuration?: number;
    side?: "top" | "bottom" | "left" | "right";
  }

  const {
    content,
    keyboard,
    children,
    child,
    delayDuration = 300,
    side,
  }: Props = $props();
</script>

<Tooltip {delayDuration}>
  <TooltipTrigger>
    {@render children()}
  </TooltipTrigger>
  <TooltipContent {side}>
    {#if content}
      <span class="text-xs">{content}</span>
    {/if}
    {#if keyboard}
      <span class="bg-background text-xs text-primary rounded py-0.25 px-0.5">
        {keyboard}
      </span>
    {/if}
    {@render child?.()}
  </TooltipContent>
</Tooltip>
