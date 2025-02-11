<script lang="ts">
	import { isTextSelection, type Editor } from '@tiptap/core';
	import { BubbleMenu } from 'svelte-tiptap';
	import FontSize from '../icons/font-size.svelte';
	import Bold from '../icons/bold.svelte';
	import Italic from '../icons/italic.svelte';
	import Underline from '../icons/underline.svelte';
	import Strikethrough from '../icons/strikethrough.svelte';
	import Textalign from '../icons/textalign.svelte';
	import Superscript from '../icons/superscript.svelte';
	import Subscript from '../icons/subscript.svelte';
	import type { ShouldShowProps } from './types';
	import Link from '../icons/link.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { EllipsisVertical } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import ButtleList from '../icons/buttle-list.svelte';
	import OrderedList from '../icons/ordered-list.svelte';
	import TaskList from '../icons/task-list.svelte';
	import BlockQuote from '../icons/block-quote.svelte';
	import Code from '../icons/code.svelte';
	import Quickcolor from '../icons/quickcolor.svelte';
	import CodeBlock from '../icons/code-block.svelte';

	interface Props {
		editor: Editor;
	}

	let { editor }: Props = $props();

	function shouldShow(props: ShouldShowProps) {
		const { view, editor } = props;
		if (!view || editor.view.dragging) {
			return false;
		}
		if (editor.isActive('link')) return false;
		if (editor.isActive('codeBlock')) return false;
		const {
			state: {
				doc,
				selection,
				selection: { empty, from, to }
			}
		} = editor;
		// check if the selection is a table grip
		const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
		const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
		const node = nodeDOM || domAtPos;

		if (isTableGripSelected(node)) {
			return false;
		}
		// Sometime check for `empty` is not enough.
		// Doubleclick an empty paragraph returns a node size of 2.
		// So we check also for an empty text size.
		const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(selection);
		if (empty || isEmptyTextBlock || !editor.isEditable) {
			return false;
		}
		return true;
	}

	const isTableGripSelected = (node: HTMLElement) => {
		let container = node;
		while (container && !['TD', 'TH'].includes(container.tagName)) {
			container = container.parentElement!;
		}
		const gripColumn =
			container && container.querySelector && container.querySelector('a.grip-column.selected');
		const gripRow =
			container && container.querySelector && container.querySelector('a.grip-row.selected');
		if (gripColumn || gripRow) {
			return true;
		}
		return false;
	};
</script>

<BubbleMenu
	{editor}
	class="flex w-fit h-fit items-center gap-1 bg-background/90 backdrop-blur-md p-0.5 rounded-md border"
	pluginKey="bubble-menu"
	{shouldShow}
	updateDelay={100}
	tippyOptions={{
		popperOptions: {
			placement: 'top-start',
			modifiers: [
				{
					name: 'preventOverflow',
					options: {
						boundary: 'viewport',
						padding: 8
					}
				},
				{
					name: 'flip',
					options: {
						fallbackPlacements: ['bottom-start', 'top-end', 'bottom-end']
					}
				}
			]
		},
		maxWidth: 'calc(100vw - 16px)'
	}}
>
	<FontSize {editor} />
	<Textalign {editor} />
	<Quickcolor {editor} />
	<Link {editor} />
	<CodeBlock {editor} />
	<Bold {editor} />
	<Italic {editor} />
	<Underline {editor} />
	<Strikethrough {editor} />
	<Popover.Root>
		<Popover.Trigger class={buttonVariants({ variant: 'ghost', class: 'size-8' })}>
			<EllipsisVertical />
		</Popover.Trigger>
		<Popover.Content
			side="top"
			sideOffset={10}
			align="start"
			class="h-fit w-fit flex items-center p-0.5 gap-1"
			portalProps={{ disabled: true, to: undefined }}
			trapFocus={false}
		>
			<BlockQuote {editor} />
			<Code {editor} />
			<Superscript {editor} />
			<Subscript {editor} />
			<ButtleList {editor} />
			<OrderedList {editor} />
			<TaskList {editor} />
		</Popover.Content>
	</Popover.Root>
</BubbleMenu>
