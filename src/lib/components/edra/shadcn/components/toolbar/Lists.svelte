<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import * as Select from '$lib/components/ui/select';
	import commands from '$lib/components/edra/commands/toolbar-commands';
	import { cn } from '$lib/utils';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import Minus from '@lucide/svelte/icons/minus';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	const lists = commands['lists'];

	const isActive = $derived.by(() => {
		return lists.find((h) => h.isActive?.(editor)) !== undefined;
	});

	const ListIcon = $derived.by(() => {
		const h = lists.find((h) => h.isActive?.(editor));
		return h ? h.icon : Minus;
	});
</script>

<Select.Root type="single">
	<EdraToolTip tooltip="Lists">
		<Select.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'icon',
				class: cn(
					'gap-0 p-0',
					'hover:bg-accent dark:hover:bg-accent/50! border-0 bg-transparent! ring-0 [&_svg]:size-2',
					isActive && 'bg-muted!'
				)
			})}
		>
			<ListIcon class="stroke-primary size-4!" />
		</Select.Trigger>
	</EdraToolTip>
	<Select.Content class="w-fit">
		{#each lists as list (list)}
			{@const Icon = list.icon}
			<Select.Item value={list.name} onclick={() => list.onClick?.(editor)}>
				<Icon />
				{list.tooltip}
				<small class="text-muted-foreground ml-auto text-xs">{list.shortCut}</small>
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
