import { Node, nodeInputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { toast } from 'svelte-sonner';

export interface VideoOptions {
	HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		video: {
			/**
			 * Set a video node
			 */
			setVideo: (src: string) => ReturnType;
			/**
			 * Toggle a video
			 */
			toggleVideo: (src: string) => ReturnType;
			/**
			 * Remove a video
			 */
			removeVideo: () => ReturnType;
		};
	}
}

const VIDEO_INPUT_REGEX = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export const Video = (onDrop?: (file: File) => Promise<string>) =>
	Node.create<VideoOptions>({
		name: 'video',
		group: 'block',
		content: 'inline*',
		draggable: true,
		isolating: true,
		addOptions() {
			return {
				HTMLAttributes: {}
			};
		},
		addAttributes() {
			return {
				src: {
					default: null,
					parseHTML: (el) => (el as HTMLSpanElement).getAttribute('src'),
					renderHTML: (attrs) => ({ src: attrs.src })
				}
			};
		},
		parseHTML() {
			return [
				{
					tag: 'video',
					getAttrs: (el) => ({ src: (el as HTMLVideoElement).getAttribute('src') })
				}
			];
		},

		renderHTML({ HTMLAttributes }) {
			return [
				'video',
				{ controls: 'true', style: 'width: fit-content;', ...HTMLAttributes },
				['source', HTMLAttributes]
			];
		},
		addCommands() {
			return {
				setVideo:
					(src: string) =>
					({ commands }) =>
						commands.insertContent(
							`<video playsinline="true" controls="true" src="${src}" style="display: block; width: fit-content"  />`
						),

				toggleVideo:
					() =>
					({ commands }) =>
						commands.toggleNode(this.name, 'paragraph'),
				removeVideo:
					() =>
					({ commands }) =>
						commands.deleteNode(this.name)
			};
		},
		addInputRules() {
			return [
				nodeInputRule({
					find: VIDEO_INPUT_REGEX,
					type: this.type,
					getAttributes: (match) => {
						const [, , src] = match;

						return { src };
					}
				})
			];
		},
		addProseMirrorPlugins() {
			return [
				new Plugin({
					key: new PluginKey('videoDropPlugin'),

					props: {
						handleDOMEvents: {
							paste(view, event) {
								const {
									state: { schema, tr },
									dispatch
								} = view;
								const hasFiles =
									event.clipboardData &&
									event.clipboardData.files &&
									event.clipboardData.files.length;

								if (!hasFiles) return false;

								const videos = Array.from(event.clipboardData.files).filter((file) =>
									/video/i.test(file.type)
								);

								if (videos.length === 0) return false;

								event.preventDefault();

								if (videos.length > 1) {
									toast.warning(`Can not paste multple files at once!`, {
										description: `You can only paste one file at a time. Only the first file will be pasted.`
									});
								}

								const video = videos[0];
								const id = toast.loading('Processing Pasted Video');
								onDrop?.(video)
									.then((src) => {
										const node = schema.nodes.video.create({ src });
										const transaction = tr.replaceSelectionWith(node);
										dispatch(transaction);
										toast.dismiss(id);
									})
									.catch((err) => {
										console.error(err);
										toast.error('Could not handle pasted video', { id });
									});

								return true;
							},
							drop(view, event) {
								const {
									state: { schema, tr },
									dispatch
								} = view;
								const hasFiles =
									event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length;

								if (!hasFiles) return false;

								const videos = Array.from(event.dataTransfer.files).filter((file) =>
									/video/i.test(file.type)
								);

								if (videos.length === 0) return false;

								event.preventDefault();

								const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

								if (videos.length > 1) {
									toast.warning(`Can not drop multple files at once!`, {
										description: `You can only drop one file at a time. Only the first file will be processed.`
									});
								}

								const video = videos[0];
								const id = toast.loading('Processing Dropped Video');
								onDrop?.(video)
									.then((src) => {
										if (coordinates && typeof coordinates.pos === 'number') {
											const node = schema.nodes.video.create({ src });
											const transaction = tr.insert(coordinates.pos, node);
											dispatch(transaction);
										}
										toast.dismiss(id);
									})
									.catch((err) => {
										console.error(err);
										toast.error('Could not upload video', { id });
									});

								return true;
							}
						}
					}
				})
			];
		}
	});
