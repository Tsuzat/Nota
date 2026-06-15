<script lang="ts">
import { useSidebar } from '@nota/ui/shadcn/sidebar';
import type { Snippet } from 'svelte';
import { ISMACOS, ISWINDOWS } from '$lib/utils';
import BackAndForthButtons from './back-and-forth-buttons.svelte';
import WindowsButtons from './windows-buttons.svelte';

interface Props {
  showAppMenu?: boolean;
  showSeparator?: boolean;
  class?: string;
  left?: Snippet;
  right?: Snippet;
  children?: Snippet;
}

const { showAppMenu = true, showSeparator = false, class: className = '', left, right, children }: Props = $props();

const sidebar = useSidebar();
</script>

<header
  data-tauri-drag-region
  class="flex h-12 shrink-0 items-center justify-between px-4 transition-[padding-left] duration-200 ease-in-out select-none {className}"
  class:pl-24={ISMACOS && !sidebar.open}
>
  <div class="flex items-center gap-2" data-tauri-drag-region>
    {#if !sidebar.open}
      <BackAndForthButtons {showAppMenu} {showSeparator} />
    {/if}
    {#if left}
      {@render left()}
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>

  <div class="flex items-center gap-2" data-tauri-drag-region>
    {#if right}
      {@render right()}
    {/if}
    {#if ISWINDOWS}
      {#if right}
        <div class="border-l h-4 mx-2"></div>
      {/if}
      <WindowsButtons />
    {/if}
  </div>
</header>
