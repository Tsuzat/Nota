<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
  } from "@nota/ui/shadcn/tooltip/index.ts";
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
    delayDuration = 100,
    side,
  }: Props = $props();
</script>

<Tooltip {delayDuration} {side}>
  <TooltipTrigger>
    {@render children()}
  </TooltipTrigger>
  <TooltipContent {side}>
    {#if content}
      <p>{content}</p>
    {/if}
    {#if keyboard}
      <span class="bg-background text-primary rounded p-0.5">
        {keyboard}
      </span>
    {/if}
    {@render child?.()}
  </TooltipContent>
</Tooltip>
