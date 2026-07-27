<script lang="ts">
import { SimpleToolTip } from '@lib/components/custom';
import { getKeyboardShortcut } from '@lib/components/edra';
import { cn } from '@lib/utils';
import { SidebarTrigger } from '@nota/ui/shadcn/sidebar';
import type { Snippet } from 'svelte';

interface Props {
  showSeparator?: boolean;
  class?: string;
  left?: Snippet;
  right?: Snippet;
  children?: Snippet;
}

const { class: className = '', left, right, children }: Props = $props();
</script>

<header
  class={cn(
    "flex h-12 shrink-0 items-center justify-between overflow-hidden px-4 transition-[padding-left] duration-200 ease-in-out select-none",
    className,
  )}
>
  <div class="flex items-center">
    <SimpleToolTip
      content="Toggle Sidebar"
      keyboard={getKeyboardShortcut("\\", true)}
    >
      <SidebarTrigger />
    </SimpleToolTip>
    {#if left}
      {@render left()}
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>

  <div class="flex items-center gap-2">
    {#if right}
      {@render right()}
    {/if}
  </div>
</header>
