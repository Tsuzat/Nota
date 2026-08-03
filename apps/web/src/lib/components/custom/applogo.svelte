<script lang="ts">
import { cn } from '@nota/ui/utils';
import { slide } from 'svelte/transition';
import { resolve } from '$app/paths';

interface Props {
  size?: number;
  showLogo?: boolean;
  logo?: string;
  class?: string;
}

let { size = 2.5, showLogo = true, logo = 'Nota', class: className = '' }: Props = $props();
</script>

<a class={cn('nodefault flex items-center', className)} href={resolve('/')}>
    <img src="/web-app-manifest-192x192.png" alt={logo} class="size-8" />
	{#if showLogo}
		<div transition:slide={{ axis: 'x' }} class="ml-4 hidden text-2xl font-bold sm:block">
			{logo}
		</div>
	{/if}
</a>
