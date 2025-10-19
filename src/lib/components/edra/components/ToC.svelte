<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { type TableOfContentData } from '@tiptap/extension-table-of-contents';
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Menu } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { TextSelection } from '@tiptap/pm/state';
	import { pushState } from '$app/navigation';

	interface Props {
		editor: Editor;
		items?: TableOfContentData;
	}

	const { editor, items }: Props = $props();

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
		pushState(`#${id}`, {
			showModal: true
		});
		element.scrollIntoView({
			behavior: 'smooth'
		});
	};
</script>

<Popover.Root>
	<Popover.Trigger
		class={buttonVariants({
			variant: 'outline',
			class: 'fixed right-4 bottom-4 size-8 rounded-full'
		})}
	>
		<Menu />
	</Popover.Trigger>
	<Popover.Content class="flex max-h-96 max-w-56 flex-col gap-1.5 overflow-auto !p-2">
		{#if items === undefined || items.length === 0}
			<div>No contents</div>
		{:else}
			{#each items as item}
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
</Popover.Root>
