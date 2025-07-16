import { browser } from '$app/environment';
import type { Editor } from '@tiptap/core';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';

/**
 * Check if the current browser is in mac or not
 */
export const isMac = browser
	? navigator.userAgent.includes('Macintosh') || navigator.userAgent.includes('Mac OS X')
	: false;

/**
 * Function to handle paste event of an image
 * @param editor Editor - editor instance
 * @param maxSize number - max size of the image to be pasted in MB, default is 2MB
 */
export function getHandlePaste(editor: Editor, maxSize: number = 2) {
	return (view: EditorView, event: ClipboardEvent) => {
		const item = event.clipboardData?.items[0];

		if (item?.type.indexOf('image') !== 0) {
			return;
		}

		const file = item.getAsFile();
		if (file === null || file.size === undefined) return;
		const filesize = (file?.size / 1024 / 1024).toFixed(4);

		if (filesize && Number(filesize) > maxSize) {
			window.alert(`too large image! filesize: ${filesize} mb`);
			return;
		}

		const reader = new FileReader();
		reader.readAsDataURL(file);
		// reader.onload = (e) => {
		// 	if (e.target?.result) {
		// 		editor.commands.setImage({ src: e.target.result as string });
		// 	}
		// };
	};
}

export const findColors = (doc: Node) => {
	const hexColor = /(#[0-9a-f]{3,6})\b/gi;
	const decorations: Decoration[] = [];

	doc.descendants((node, position) => {
		if (!node.text) {
			return;
		}

		Array.from(node.text.matchAll(hexColor)).forEach((match) => {
			const color = match[0];
			const index = match.index || 0;
			const from = position + index;
			const to = from + color.length;
			const decoration = Decoration.inline(from, to, {
				class: 'color',
				style: `--color: ${color}`
			});

			decorations.push(decoration);
		});
	});

	return DecorationSet.create(doc, decorations);
};

/**
 * Dupilcate content at the current selection
 * @param editor Editor instance
 * @param node Node to be duplicated
 */
export const duplicateContent = (editor: Editor, node: Node) => {
	const { view } = editor;
	const { state } = view;
	const { selection } = state;

	editor
		.chain()
		.insertContentAt(selection.to, node.toJSON(), {
			updateSelection: true
		})
		.focus(selection.to)
		.run();
};
