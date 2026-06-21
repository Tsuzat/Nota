<script lang="ts">
import { Separator } from '@nota/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@nota/ui/shadcn/sidebar';
import type { Snippet } from 'svelte';

interface Props {
  showSeparator?: boolean;
  class?: string;
  left?: Snippet;
  right?: Snippet;
  children?: Snippet;
}

const { showSeparator = false, class: className = '', left, right, children }: Props = $props();

const sidebar = useSidebar();
</script>

<header
  class="flex h-12 shrink-0 items-center justify-between overflow-hidden px-4 select-none {className}"
>
  <div class="flex items-center gap-2">
    {#if sidebar && !sidebar.open}
      <SidebarTrigger />
      {#if showSeparator}
        <Separator orientation="vertical" class="h-4! mx-1" />
      {/if}
    {/if}
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
