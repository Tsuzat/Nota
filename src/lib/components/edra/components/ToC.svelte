<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { type TableOfContentData } from '@tiptap/extension-table-of-contents';
	import { cn } from '$lib/utils';
	import { TextSelection } from '@tiptap/pm/state';
	import { pushState } from '$app/navigation';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { flip } from 'svelte/animate';

	interface Props {
		editor: Editor;
		items?: TableOfContentData;
	}

	const { editor, items }: Props = $props();

	let highlighedIndex = $derived.by(() => {
		if (!items || items.length === 0) {
			return -1;
		}
		for (let i = 0; i < items.length; i++) {
			if (!items[i].isScrolledOver) {
				return i + 1;
			}
		}
		return -1;
	});

	const onItemClick = (e: Event, id: string) => {
		e.preventDefault();

		const element = editor.view.dom.querySelector(`[data-toc-id="${id}"`);

		if (!element) {
			return;
		}
		const pos = editor.view.posAtDOM(element, 0);

		// set focus
		const tr = editor.view.state.tr;
		tr.setSelection(new TextSelection(tr.doc.resolve(pos)));
		editor.view.dispatch(tr);
		editor.view.focus();
		pushState('', {
			showModal: true
		});
		element.scrollIntoView({
			behavior: 'smooth'
		});
	};
</script>

<!-- <Popover.Root>
	<Popover.Trigger
		class={buttonVariants({
			variant: 'outline',
			class: 'fixed right-4 bottom-4 size-8 rounded-full print:hidden'
		})}
	>
		<Menu />
	</Popover.Trigger>
	<Popover.Content class="flex max-h-96 max-w-56 flex-col gap-1.5 overflow-auto p-2!">
		{#if items === undefined || items.length === 0}
			<div>No contents</div>
		{:else}
			{#each items as item (item.id)}
				<a
					href={`#${item.id}`}
					onclick={(e) => onItemClick(e, item.id)}
					data-item-index={item.itemIndex}
					class={cn(
						'text-foreground text-sm text-wrap transition-all duration-500',
						item.isScrolledOver && 'text-muted-foreground font-thin'
					)}
					class:is-active={item.isActive && !item.isScrolledOver}
					style={`padding-left: calc(1rem * ${item.level - 1});`}
				>
					{item.textContent}
				</a>
			{/each}
		{/if}
	</Popover.Content>
</Popover.Root> -->

<Tooltip.Provider>
	<Tooltip.Root delayDuration={100}>
		<Tooltip.Trigger class="fixed top-1/3 right-4 flex h-full max-h-96 flex-col gap-3 ">
			{#each items as item (item)}
				<div class={cn('bg-muted h-[2px] w-4 rounded', item.isActive && 'bg-foreground')}></div>
			{/each}
		</Tooltip.Trigger>
		<Tooltip.Content
			side="left"
			sideOffset={-24}
			align="start"
			alignOffset={48}
			class="bg-popover data-[side=left]:slide-in-from-right-56 fade-in-100 flex max-h-120 max-w-56 flex-col gap-1.5 overflow-auto border duration-300"
			arrowClasses="hidden"
			strategy="absolute"
		>
			{#if items === undefined || items.length === 0}
				<div>No contents</div>
			{:else}
				{#each items as item (item.id)}
					<a
						href={`#${item.id}`}
						onclick={(e) => onItemClick(e, item.id)}
						class={cn(
							'text-foreground text-sm text-wrap transition-all duration-500',
							item.isScrolledOver && 'text-muted-foreground font-thin'
						)}
						style={`padding-left: calc(1rem * ${item.level - 1});`}
					>
						{item.textContent}
					</a>
				{/each}
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
