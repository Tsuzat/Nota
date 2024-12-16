<script lang="ts">
	import { type Editor } from '@tiptap/core';
	import { onMount } from 'svelte';
	import { BubbleMenuPlugin, type BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';

	import Bold from './icons/bold.svelte';
	import Italic from './icons/italic.svelte';
	import Underline from './icons/underline.svelte';
	import Strikethrough from './icons/strikethrough.svelte';
	import Link from './icons/link.svelte';
	import Code from './icons/code.svelte';
	import Subscript from './icons/subscript.svelte';
	import ButtleList from './icons/buttle-list.svelte';
	import OrderedList from './icons/ordered-list.svelte';
	import TaskList from './icons/task-list.svelte';
	import Superscript from './icons/superscript.svelte';
	import Align from './icons/textalign.svelte';
	import Quickcolor from './icons/quickcolor.svelte';
	import Table from './icons/table.svelte';
	import Image from './icons/image.svelte';
	import Text from './icons/text.svelte';
	import SearchReplace from './icons/search-replace.svelte';
	import Undo from './icons/undo.svelte';
	import Redo from './icons/redo.svelte';
	import BlockQuote from './icons/block-quote.svelte';
	import Textcolor from './icons/textcolor.svelte';
	import Highlighter from './icons/highlighter.svelte';

	interface Props {
		editor: Editor;
	}

	let { editor }: Props = $props();

	// const tippyOptions = {};
	// const pluginKey = 'SvelteTiptapBubbleMenu';
	// const shouldShow = null;
	// const updateDelay = 100;

	// let element: HTMLElement;

	// onMount(() => {
	// 	const plugin = BubbleMenuPlugin({
	// 		pluginKey,
	// 		editor,
	// 		element,
	// 		tippyOptions,
	// 		shouldShow,
	// 		updateDelay
	// 	});

	// 	editor.registerPlugin(plugin);

	// 	return () => editor.unregisterPlugin(pluginKey);
	// });
</script>

<div class="flex max-w-fit mx-auto bg-muted/30 mb-1 p-0.5 rounded">
	<Undo {editor} />
	<Redo {editor} />
	<Text {editor} />
	<Bold {editor} />
	<Italic {editor} />
	<Underline {editor} />
	<Strikethrough {editor} />
	<Align {editor} />
	<Link {editor} />
	<Code {editor} />
	<BlockQuote {editor} />
	<Subscript {editor} />
	<Superscript {editor} />
	<ButtleList {editor} />
	<OrderedList {editor} />
	<TaskList {editor} />
	<Image {editor} />
	<Table {editor} />
	<Textcolor {editor} />
	<Highlighter {editor} />
	<Quickcolor {editor} />
	<SearchReplace {editor} />
</div>
