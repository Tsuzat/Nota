<script lang="ts">
import * as Tooltip from '@lib/components/ui/tooltip';
import { cn } from '@lib/utils';
import type { Snippet } from 'svelte';

interface Props {
  class?: string;
  ref: HTMLDivElement | null;
  content: string;
  children?: Snippet<[]>;
}

let { class: className = '', ref = $bindable(), children, content }: Props = $props();
</script>

<Tooltip.Provider>
  <Tooltip.Root delayDuration={100}>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <div
          bind:this={ref}
          {...props}
          class={cn(
            "z-10 flex size-14 cursor-pointer items-center justify-center rounded-xl border bg-background p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] transition-all duration-200 dark:hover:border-primary",
            className,
          )}
        >
          {@render children?.()}
        </div>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content class="p-2">
      {content}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
