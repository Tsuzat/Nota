import type { FileType } from '$lib/utils';
import type { Content, Editor } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Snippet } from 'svelte';

export interface EdraEditorProps {
	content?: Content;
	editable?: boolean;
	editor?: Editor;
	autofocus?: boolean;
	onUpdate?: () => void;
	class?: string;
	spellcheck?: boolean;
	onFileSelect?: (files: string[]) => Promise<string[]>;
	onDropOrPaste?: (file: File) => Promise<string>;
	getAssets?: (fileType: FileType) => Promise<string[]>;
}

export interface EdraToolbarProps {
	editor: Editor;
	class?: string;
	excludedCommands?: string[];
	children?: Snippet<[]>;
}

export interface ShouldShowProps {
	editor: Editor;
	element: HTMLElement;
	view: EditorView;
	state: EditorState;
	oldState?: EditorState;
	from: number;
	to: number;
}
