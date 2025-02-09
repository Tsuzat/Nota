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
	import FileHandler from '@tiptap-pro/extension-file-handler';

	import { SmilieReplacer } from './custom/Extentions/SmilieReplacer.js';
	import { ColorHighlighter } from './custom/Extentions/ColorHighlighter.js';
	import { ImageExtension } from './custom/Extentions/ImageExtention.js';
	import { SvelteNodeViewRenderer } from 'svelte-tiptap';
	import CodeExtended from './custom/code-extended.svelte';

	// Katex Support
	import 'katex/dist/katex.min.css';
	import { Mathematics } from '@tiptap-pro/extension-mathematics';

	// Lowlight
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
	import '@fontsource-variable/fira-code';
	import { all, createLowlight } from 'lowlight';
	import './onedark.css';
	import SearchAndReplace from './custom/Extentions/SearchAndReplace.js';
	import SearchReplace from './icons/search-replace.svelte';
	import AutoJoiner from 'tiptap-extension-auto-joiner';
	import Button from '../ui/button/button.svelte';
	import { ArrowUp } from 'lucide-svelte';
	import Tooltip from '../customs/tooltip.svelte';
	import { handleRawImage } from './utils';
	import { cn, printAsPDF } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import { VideoExtention } from './custom/Extentions/VideoExtended';
	import LinkMenu from './menus/link-menu.svelte';
	import { Table, TableCell, TableHeader, TableRow } from './custom/Extentions/table';
	import TableColMenu from './custom/Extentions/table/menu/table-col-menu.svelte';
	import TableRowMenu from './custom/Extentions/table/menu/table-row-menu.svelte';
	import DragHandle from './drag-handle.svelte';
	import SlashCommand from './tmp/slash-command/slashcommand';

	const lowlight = createLowlight(all);

	interface Props {
		class?: string;
		content?: Content;
		path: string;
		showToolbar?: boolean;
		editable: boolean;
		spellCheck: boolean;
		onChange: (content: Content) => void;
	}

	let {
		class: className = '',
		content = $bindable(''),
		path,
		showToolbar = true,
		editable = true,
		spellCheck = false,
		onChange
	}: Props = $props();

	$effect(() => {
		if (!editor) return;
		editor.setEditable(editable);
	});

	let editor = $state<Editor>();
	let element = $state<HTMLElement>();

	// Open Popovers
	let searchReplaceOpen = $state(false);

	onMount(() => {
		editor = new Editor({
			element,
			content,
			editable,
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
					placeholder: ({ node }) => {
						if (node.type.name === 'heading') {
							return 'What’s the title?';
						}
						if (node.type.name === 'paragraph') {
							return 'Write something or press / for commands';
						}
						return '';
					}
				}),
				FileHandler.configure({
					allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
					onDrop: (currentEditor, files, pos) => {
						files.forEach(async (file) => {
							const filePath = await handleRawImage(file, path);
							currentEditor
								.chain()
								.insertContentAt(pos, {
									type: 'image',
									attrs: {
										src: filePath
									}
								})
								.focus()
								.run();
						});
					},
					onPaste: (currentEditor, files, htmlContent) => {
						files.forEach(async (file) => {
							if (htmlContent) {
								// if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
								// you could extract the pasted file from this url string and upload it to a server for example
								return false;
							}
							const filePath = await handleRawImage(file, path);
							currentEditor
								.chain()
								.insertContentAt(currentEditor.state.selection.anchor, {
									type: 'image',
									attrs: {
										src: filePath
									}
								})
								.focus()
								.run();
						});
					}
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
					HTMLAttributes: {
						target: '_tab',
						rel: 'noopener noreferrer nofollow'
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
				Table,
				TableRow,
				TableHeader,
				TableCell,
				ImageExtension,
				Mathematics,
				VideoExtention,
				SlashCommand
			],
			autofocus: true,
			onUpdate: ({ editor }) => {
				content = editor.getJSON();
				onChange(content);
			},
			onTransaction: (transaction) => {
				editor = undefined;
				editor = transaction.editor;
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
		if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			if (element) printAsPDF(element);
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<div class={cn('!overflow-hidden', className)}>
	{#if editor}
		<DragHandle {editor} />
		<SearchReplace {editor} bind:open={searchReplaceOpen} />
		<LinkMenu {editor} />
		<TableColMenu {editor} />
		<TableRowMenu {editor} />
		{#if showToolbar}
			<span transition:slide={{ duration: 300 }}>
				<EditorToolbar {editor} {path} />
			</span>
		{/if}
	{/if}
	<div bind:this={element} spellcheck={spellCheck} class="h-full overflow-y-auto flex-1"></div>
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
