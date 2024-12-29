<script lang="ts">
	import './editor.css';

	import { Editor, type Content } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import EditorToolbar from './editor-toolbar.svelte';

	import { Subscript } from '@tiptap/extension-subscript';
	import { Superscript } from '@tiptap/extension-superscript';
	import { Underline } from '@tiptap/extension-underline';
	import { Link } from '@tiptap/extension-link';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import TextStyle from '@tiptap/extension-text-style';
	import Color from '@tiptap/extension-color';
	import Highlight from '@tiptap/extension-highlight';
	import Text from '@tiptap/extension-text';
	import Typography from '@tiptap/extension-typography';
	import TextAlign from '@tiptap/extension-text-align';

	import { SmilieReplacer } from './custom/Extentions/SmilieReplacer.js';
	import { ColorHighlighter } from './custom/Extentions/ColorHighlighter.js';
	import Table from '@tiptap/extension-table';
	import TableRow from '@tiptap/extension-table-row';
	import TableHeader from '@tiptap/extension-table-header';
	import TableCell from '@tiptap/extension-table-cell';
	import { ImageExtension } from './custom/Extentions/ImageExtention.js';
	import { SvelteNodeViewRenderer } from 'svelte-tiptap';
	import CodeExtended from './custom/code-extended.svelte';

	// Lowlight
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
	import '@fontsource-variable/fira-code';
	import { all, createLowlight } from 'lowlight';
	import './onedark.css';
	import SearchAndReplace from './custom/Extentions/SearchAndReplace.js';
	import { ImagePlaceholder } from './custom/Extentions/ImagePlaceHolder.js';
	import DragHandle from '@tiptap-pro/extension-drag-handle';

	const lowlight = createLowlight(all);

	interface Props {
		class?: string;
		content?: Content;
		showToolbar?: boolean;
		onChange: (content: Content) => void;
	}

	let {
		class: className = '',
		content = $bindable(''),
		showToolbar = true,
		onChange
	}: Props = $props();

	let editor = $state<Editor>();
	let element = $state<HTMLElement>();

	onMount(() => {
		editor = new Editor({
			element,
			content,
			editorProps: {
				attributes: {
					class:
						'm-auto p-2 pl-4 focus:outline-none flex-1 prose text-foreground mx-auto max-w-3xl dark:prose-invert *:my-2'
				}
			},
			extensions: [
				StarterKit.configure({
					orderedList: {
						HTMLAttributes: {
							class: 'list-decimal'
						}
					},
					bulletList: {
						HTMLAttributes: {
							class: 'list-disc'
						}
					},
					heading: {
						levels: [1, 2, 3, 4],
						HTMLAttributes: {
							class: 'tiptap-heading'
						}
					},
					codeBlock: false,
					text: false
				}),
				DragHandle.configure({
					render: () => {
						const element = document.createElement('div');
						element.id = 'drag-handle';
						return element;
					}
				}),
				Typography,
				Text,
				TextStyle,
				TextAlign.configure({
					types: ['heading', 'paragraph']
				}),
				Color,
				Highlight.configure({ multicolor: true }),
				Underline,
				Superscript,
				Subscript,
				Link.configure({
					openOnClick: false,
					autolink: true,
					defaultProtocol: 'https',
					HTMLAttributes: {
						target: '_blank',
						rel: 'noopener noreferrer'
					}
				}),
				TaskList,
				TaskItem.configure({
					nested: true
				}),
				SearchAndReplace,
				CodeBlockLowlight.configure({
					lowlight
				}).extend({
					addNodeView() {
						return SvelteNodeViewRenderer(CodeExtended);
					}
				}),
				SmilieReplacer,
				ColorHighlighter,
				Table.configure({
					allowTableNodeSelection: true,
					resizable: true
				}),
				TableRow,
				TableHeader,
				TableCell,
				ImageExtension,
				ImagePlaceholder
			],
			autofocus: true,
			onUpdate: ({ editor }) => {
				content = editor.getJSON();
				onChange(content);
			},
			onTransaction: (transaction) => {
				/**
				 * Weird behavior of editor.
				 * If we do not make it undefined, then it looses it's reactivity
				 * this is because assigning editor directly to `transaction.editor`
				 * the original object is not mutated.
				 */
				editor = undefined;
				editor = transaction.editor;
				content = editor.getJSON();
			}
		});
	});

	onDestroy(() => {
		if (editor) editor.destroy();
	});
</script>

<div class={className}>
	{#if editor && showToolbar}
		<EditorToolbar {editor} />
	{/if}
	<div bind:this={element} spellcheck="false" class="h-full overflow-y-auto flex-1"></div>
</div>
