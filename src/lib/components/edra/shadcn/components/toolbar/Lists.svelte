<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import commands from '$lib/components/edra/commands/toolbar-commands';
	import { cn } from '$lib/utils';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import Minus from '@lucide/svelte/icons/minus';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

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

<DropdownMenu.Root>
	<EdraToolTip tooltip="Lists">
		<DropdownMenu.Trigger
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
			<ChevronDown class="text-muted-foreground size-2!" />
		</DropdownMenu.Trigger>
	</EdraToolTip>
	<DropdownMenu.Content portalProps={{ to: document.getElementById('nota-editor') ?? 'undefined' }}>
		<DropdownMenu.Label>Lists</DropdownMenu.Label>
		{#each lists as list (list)}
			{@const Icon = list.icon}
			<DropdownMenu.Item onclick={() => list.onClick?.(editor)}>
				<Icon />
				{list.tooltip}
				<DropdownMenu.Shortcut>{list.shortCut}</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
