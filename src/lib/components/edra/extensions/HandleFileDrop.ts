import { Extension } from '@tiptap/core';

export interface FileDropOptions {
	/**
	 * The current handler. By default it just echoes back the input.
	 */
	handler: (files: string[]) => Promise<string[]>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		fileDrop: {
			/**
			 * Set the handler that takes an array of local file paths
			 * and returns a Promise of the uploaded URLs.
			 */
			setHandleFileDrop: (handler: (files: string[]) => Promise<string[]>) => ReturnType;
			/**
			 * Call the handler you registered above,
			 * returns a Promise<string[]> of the uploaded URLs.
			 */
			handleFileDrop: (files: string[]) => Promise<string[]>;
		};
	}
}

export const FileDrop = Extension.create<FileDropOptions>({
	name: 'fileDrop',

	// initial default (identity) handler
	addOptions() {
		return {
			handler: async (files: string[]) => files
		};
	},

	// this creates a little storage bucket on `editor.storage.fileDrop`
	addStorage() {
		return {
			handler: this.options.handler
		};
	},

	addCommands() {
		return {
			setHandleFileDrop:
				(handler) =>
				({ commands, editor }) => {
					editor.storage.fileDrop.handler = handler;
					return true;
				},

			handleFileDrop:
				(files) =>
				async ({ editor }) => {
					// await the currently-registered handler
					const urls = await editor.storage.fileDrop.handler(files);
					return urls;
				}
		};
	}
});
