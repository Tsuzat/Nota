import { Editor, type Extensions, type EditorOptions, type Content } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import { ColorHighlighter } from './extensions/ColorHighlighter';
import { FontSize, TextStyle, Color } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import SearchAndReplace from './extensions/FindAndReplace';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Table, TableCell, TableRow, TableHeader } from './extensions/table';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from 'tiptap-markdown';
import MathExtension from '@aarkue/tiptap-math-extension';
import AutoJoiner from 'tiptap-extension-auto-joiner';
import 'katex/dist/katex.min.css';

export default (
	element?: HTMLElement,
	content?: Content,
	extensions?: Extensions,
	options?: Partial<EditorOptions>
) => {
	const editor = new Editor({
		element,
		content,
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
					levels: [1, 2, 3, 4]
				},
				link: {
					openOnClick: false,
					autolink: true,
					linkOnPaste: true,
					HTMLAttributes: {
						target: '_tab',
						rel: 'noopener noreferrer nofollow'
					}
				},
				codeBlock: false
			}),
			Highlight.configure({
				multicolor: true
			}),
			Placeholder.configure({
				emptyEditorClass: 'is-empty',
				// Use a placeholder:
				// Use different placeholders depending on the node type:
				placeholder: ({ node }) => {
					if (node.type.name === 'heading') {
						return 'What’s the title?';
					} else if (node.type.name === 'paragraph') {
						return 'Press / or write something ...';
					}
					return '';
				}
			}),
			Color,
			Subscript,
			Superscript,
			Typography,
			ColorHighlighter,
			TextStyle,
			FontSize,
			TextAlign.configure({
				types: ['heading', 'paragraph']
			}),
			TaskList,
			TaskItem.configure({
				nested: true
			}),
			SearchAndReplace,
			MathExtension.configure({ evaluation: true }),
			AutoJoiner,
			Table,
			TableHeader,
			TableRow,
			TableCell,
			Markdown.configure({
				html: true,
				tightLists: true,
				tightListClass: 'tight',
				bulletListMarker: '-',
				linkify: true,
				breaks: true,
				transformPastedText: true,
				transformCopiedText: true
			}),

			...(extensions ?? [])
		],
		...options
	});

	return editor;
};
