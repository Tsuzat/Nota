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
	import Placeholder from '@tiptap/extension-placeholder';

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
	import SearchReplace from './icons/search-replace.svelte';
	import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
	import AutoJoiner from 'tiptap-extension-auto-joiner';
	import Button from '../ui/button/button.svelte';
	import { ArrowUp } from 'lucide-svelte';
	import Tooltip from '../customs/tooltip.svelte';

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

	// Open Popovers
	let searchReplaceOpen = $state(false);

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
				Placeholder.configure({
					// Use a placeholder:
					placeholder: 'Write something …'
					// Use different placeholders depending on the node type:
					// placeholder: ({ node }) => {
					//   if (node.type.name === 'heading') {
					//     return 'What’s the title?'
					//   }

					//   return 'Can you add some further context?'
					// },
				}),
				GlobalDragHandle.configure({
					scrollTreshold: 100,
					dragHandleSelector: '#drag-handle'
				}),
				AutoJoiner,
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
				editor = undefined;
				editor = transaction.editor;
				content = editor.getJSON();
			}
		});
	});

	onDestroy(() => {
		if (editor) editor.destroy();
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			searchReplaceOpen = true;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<div class={className}>
	{#if editor}
		<SearchReplace {editor} bind:open={searchReplaceOpen} />
		{#if showToolbar}
			<EditorToolbar {editor} />
		{/if}
	{/if}
	<div bind:this={element} spellcheck="false" class="h-full overflow-y-auto flex-1"></div>
	<div class="fixed right-4 bottom-4">
		<Tooltip text="Scroll to Top" side="left">
			<Button
				variant="outline"
				size="icon"
				class="rounded-full"
				onclick={() => {
					element?.scrollTo({ top: 0, behavior: 'smooth' });
				}}
			>
				<ArrowUp />
			</Button>
		</Tooltip>
	</div>
</div>
