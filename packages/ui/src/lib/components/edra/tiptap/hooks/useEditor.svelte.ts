import type { EditorOptions } from "@tiptap/core";
import { browser } from "$app/env";

import { Editor } from "../Editor.ts";

export const useEditor = (options: Partial<EditorOptions> = {}) => {
	let editor: Editor | undefined;

	if (browser) {
		editor = new Editor(options);
	}

	try {
		$effect(() => {
			return () => {
				if (editor) {
					const nodes = editor.view.dom?.parentNode;
					const newEl = nodes?.cloneNode(true) as HTMLElement;
					nodes?.parentNode?.replaceChild(newEl, nodes);
					editor.destroy();
				}
			};
		});
	} catch {
		// Called outside an effect root (e.g. asynchronously during navigation)
	}

	return editor;
};
