<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn, getKeyboardShortcut } from '$lib/utils';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import type { ComponentProps } from 'svelte';
	import { useSidebar } from './context.svelte';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
</script>

<SimpleTooltip>
	<Button
		data-sidebar="trigger"
		data-slot="sidebar-trigger"
		variant="ghost"
		size="icon"
		class={cn('size-7', className)}
		type="button"
		onclick={(e) => {
			onclick?.(e);
			sidebar.toggle();
		}}
		{...restProps}
	>
		<PanelLeftIcon />
		<span class="sr-only">Toggle Sidebar</span>
	</Button>
	{#snippet child()}
		<span>
			Open Sidebar
			<span class="bg-background text-primary rounded p-0.5">
				{getKeyboardShortcut('\\', true)}
			</span>
		</span>
	{/snippet}
</SimpleTooltip>
