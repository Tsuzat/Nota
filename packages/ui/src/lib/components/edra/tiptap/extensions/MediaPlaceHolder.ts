import { mergeAttributes, Node, type NodeViewProps } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import type { Component } from "svelte";
import { FileType } from "../../utils.ts";
import { SvelteNodeViewRenderer } from "../index.ts";

export interface MediaPlaceholderOptions {
	HTMLAttributes: Record<string, unknown>;
	onUpload?: (fileType: FileType) => Promise<string | null>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		mediaPlaceholder: {
			/**
			 * Inserts a media placeholder
			 */
			insertMediaPlaceholder: (options: { mediaType: FileType }) => ReturnType;

			/**
			 * Set the upload handler
			 */
			setMediaUploadHandler: (
				handler: (fileType: FileType) => Promise<string>,
			) => ReturnType;

			/**
			 * Upload a media and insert the result
			 */
			uploadMedia: (fileType: FileType) => ReturnType;
		};
	}

	interface Storage {
		mediaPlaceholder: {
			onUpload?: (fileType: FileType) => Promise<string>;
		};
	}
}

export const MediaPlaceholder = (component: Component<NodeViewProps>) =>
	Node.create<MediaPlaceholderOptions>({
		name: "mediaPlaceholder",

		addOptions() {
			return {
				HTMLAttributes: {},
				onUpload: undefined,
			};
		},

		addStorage() {
			return {
				onUpload: this.options.onUpload,
			};
		},

		addAttributes() {
			return {
				mediaType: {
					default: "image",
					parseHTML: (element) => element.getAttribute("data-media-type"),
					renderHTML: (attributes) => {
						if (!attributes.mediaType) {
							return {};
						}
						return {
							"data-media-type": attributes.mediaType,
						};
					},
				},
			};
		},

		parseHTML() {
			return [{ tag: `div[data-type="${this.name}"]` }];
		},

		renderHTML({ HTMLAttributes }) {
			return [
				"div",
				mergeAttributes(
					{ "data-type": this.name },
					this.options.HTMLAttributes,
					HTMLAttributes,
				),
			];
		},

		group: "block",
		draggable: true,
		atom: true,
		content: "inline*",
		isolating: true,

		addNodeView() {
			return SvelteNodeViewRenderer(component);
		},

		addCommands() {
			return {
				insertMediaPlaceholder:
					(options) =>
					({ commands }) => {
						return commands.insertContent({
							type: this.name,
							attrs: {
								mediaType: options.mediaType,
							},
						});
					},

				setMediaUploadHandler:
					(handler) =>
					({ editor }) => {
						editor.storage.mediaPlaceholder.onUpload = handler;
						return true;
					},

				uploadMedia:
					(fileType: FileType) =>
					({ editor }) => {
						const onUpload =
							editor.storage.mediaPlaceholder.onUpload || this.options.onUpload;
						if (!onUpload) {
							throw new Error("onUpload is not defined");
						}

						// Detect mediaType from current selection
						let mediaType = "image";
						const { selection } = editor.state;
						if (selection instanceof NodeSelection) {
							const selectedNode = selection.node;
							if (selectedNode.type.name === this.name) {
								mediaType = selectedNode.attrs.mediaType;
							}
						}

						void onUpload(fileType)
							.then((src) => {
								if (src === null) return;
								editor.view.focus();
								if (mediaType === FileType.AUDIO) {
									editor.commands.setAudio({ src });
								} else if (mediaType === FileType.VIDEO) {
									editor.commands.setVideo({ src });
								} else if (mediaType === FileType.IMAGE) {
									editor.commands.setImage({ src });
								}
							})
							.catch((error) => {
								console.error("Failed to upload media:", error);
							});

						return true;
					},
			};
		},
	});
