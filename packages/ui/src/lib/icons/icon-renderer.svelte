<script lang="ts">
import LucideRenderer from './lucide-renderer.svelte';
import { getIconData, type IconData } from './utils';
import { cn } from '$lib/utils';
  import { icons } from '.';

const { icon, class: className }: { icon: string; class?: string } = $props();

const iconData: IconData = $derived(getIconData(icon));
</script>

{#snippet renderIcon(iconData: IconData)}
	{#if iconData.iconType === 'emoji'}
		<span class={className}>{iconData.iconData}</span>
	{:else if iconData.iconType === 'lucide'}
		<LucideRenderer icon={iconData.iconData as keyof typeof icons} class={className} />
	{:else if iconData.iconType === 'url'}
		<img src={iconData.iconData} alt="icon" class={cn(className, 'aspect-square size-5')} />
	{/if}
{/snippet}

{@render renderIcon(iconData)}
