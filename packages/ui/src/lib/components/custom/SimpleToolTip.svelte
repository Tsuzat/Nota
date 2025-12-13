<script lang="ts">
import * as Tooltip from '@lib/components/ui/tooltip';
import type { Snippet } from 'svelte';

interface Props {
  content?: string;
  children: Snippet<[]>;
  child?: Snippet<[]>;
  delayDuration?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const { content, children, child, delayDuration = 100, side }: Props = $props();
</script>

<Tooltip.Provider {delayDuration}>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {@render children()}
    </Tooltip.Trigger>
    <Tooltip.Content {side}>
      {#if content}
        <p>{content}</p>
      {/if}
      {@render child?.()}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
