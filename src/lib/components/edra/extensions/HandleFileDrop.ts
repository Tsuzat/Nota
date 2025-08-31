import type { FileType } from '$lib/utils';
import { Extension } from '@tiptap/core';

export interface FileDropOptions {
	/**
	 * The current handler. By default it just echoes back the input.
	 */
	handler: (files: string) => Promise<string>;
	/**
	 * The assets getter. By default it returns an empty array.
	 */
	assetsGetter: (fileType: FileType) => Promise<string[]>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		fileDrop: {
			/**
			 * Set the handler that takes an array of local file paths
			 * and returns a Promise of the uploaded URLs.
			 */
			setHandleFileDrop: (handler: (file: string) => Promise<string>) => ReturnType;
			/**
			 * Call the handler you registered above,
			 * returns a Promise<string[]> of the uploaded URLs.
			 */
			handleFileDrop: (file: string) => Promise<string>;
			/**
			 * Set the assets getter that takes a file type
			 * and returns a Promise of the asset URLs.
			 */
			setGetAssets: (getter: (fileType: string) => Promise<string[]>) => ReturnType;
			/**
			 * Get assets for a specific file type,
			 * returns a Promise<string[]> of the asset URLs.
			 */
			getAssets: (fileType: string) => Promise<string[]>;
		};
	}

	interface Storage {
		fileDrop: {
			handler: (file: string) => Promise<string>;
			assetsGetter: (fileType: string) => Promise<string[]>;
		};
	}
}

export const FileDrop = Extension.create<FileDropOptions>({
	name: 'fileDrop',

	// initial default handlers
	addOptions() {
		return {
			handler: async (file: string) => file,
			assetsGetter: async () => []
		};
	},

	// this creates a little storage bucket on `editor.storage.fileDrop`
	addStorage() {
		return {
			handler: this.options.handler,
			assetsGetter: this.options.assetsGetter
		};
	},

	addCommands() {
		return {
			setHandleFileDrop:
				(handler) =>
				({ editor }) => {
					editor.storage.fileDrop.handler = handler;
					return true;
				},

			handleFileDrop:
				(file) =>
				({ editor }) => {
					// await the currently-registered handler
					return editor.storage.fileDrop.handler(file);
				},

			setGetAssets:
				(getter) =>
				({ editor }) => {
					editor.storage.fileDrop.assetsGetter = getter;
					return true;
				},

			getAssets:
				(fileType) =>
				({ editor }) => {
					// await the currently-registered assets getter
					return editor.storage.fileDrop.assetsGetter(fileType);
				}
		};
	}
});
