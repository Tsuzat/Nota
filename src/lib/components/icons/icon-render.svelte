<script lang="ts">
	import { getIconType } from '$lib/utils';
	import { icons } from 'lucide-svelte';
	import LucideIconRender from './lucide-icon-render.svelte';

	interface Props {
		icon: string;
		class?: string;
	}
	let { icon, class: className = '' }: Props = $props();

	const iconType = getIconType(icon);
</script>

{#if iconType === 'emoji'}
	<span class={className}>{icon}</span>
{:else if iconType === 'lucide'}
	<LucideIconRender {icon} class={className} />
{:else}
	<img src={icon} alt="Icon" srcset="" />
{/if}
