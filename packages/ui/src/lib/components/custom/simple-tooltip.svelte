<script lang="ts">
import type { Snippet } from "svelte";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Props {
	content?: string;
	keyboard?: string;
	children: Snippet<[]>;
	childContent?: Snippet<[]>;
	delayDuration?: number;
	side?: "top" | "bottom" | "left" | "right";
}

const {
	content,
	keyboard,
	children,
	childContent,
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
    {@render childContent?.()}
  </TooltipContent>
</Tooltip>
