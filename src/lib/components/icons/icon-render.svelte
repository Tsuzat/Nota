<script lang="ts">
	import { cn } from '$lib/utils';
	import SvgIcon from './svg-icon.svelte';
	import { getIconTypeAndData } from './utils';

	interface Props {
		icon: string;
		class?: string;
	}
	let { icon, class: className = '' }: Props = $props();

	const iconType = $derived.by(() => getIconTypeAndData(icon));
</script>

{#if iconType.type === 'emoji'}
	<span class={className}>
		{iconType.icon}
	</span>
{:else if iconType.type === 'svg'}
	<SvgIcon body={iconType.icon} class={cn('size-6', className)} />
{:else}
	<img src={iconType.icon} alt="icon" class={className} />
{/if}
