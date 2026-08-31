import type { Extensions } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TableOfContents, {
	getHierarchicalIndexes,
} from "@tiptap/extension-table-of-contents";
import { common, createLowlight } from "lowlight";
import { getDefaultExtensions } from "../extensions.ts";
import { MediaPlaceholder } from "../tiptap/extensions/MediaPlaceHolder.ts";
import {
	AIHighlight,
	Callout,
	IFrameExtended,
	ImageExtended,
	Mermaid,
	SlashCommand,
	SvelteNodeViewRenderer,
	useEditor,
	VideoExtended,
} from "../tiptap/index.ts";
import type { FileType } from "../utils.ts";
import CalloutComp from "./components/Callout.svelte";
import CodeBlock from "./components/CodeBlock.svelte";
import IFrameComp from "./components/IFrame.svelte";
import ImageExtendedComp from "./components/ImageExtended.svelte";
import MediaPlaceholderComp from "./components/MediaPlaceHolder.svelte";
import MermaidComp from "./components/Mermaid.svelte";
import SlashCommandComp from "./components/SlashCommand.svelte";
import VideoExtendedComp from "./components/VideoExtended.svelte";
import { setTocItems } from "./toc.svelte";

const lowlight = createLowlight(common);

export interface EdraEditorProps {
	extensions?: Extensions;
	onUpdate?: () => void;
	/**
	 * When true, disables StarterKit history (undo/redo) for use with
	 * Yjs Collaboration. Required because Collaboration handles its own history.
	 */
	collaborative?: boolean;
	/**
	 * Callback function to handle file uploads when a user drags/drops, pastes,
	 * or selects a media file (image, video, audio) to insert.
	 * It should upload the file to your storage (e.g., S3, Vercel Blob, etc.)
	 * and return a promise resolving to the public URL of the uploaded file.
	 *
	 * @param fileType Type of file to be uploaded.
	 * @param noteId Id of the note to upload the file to.
	 * @returns A promise resolving to the uploaded file's URL.
	 */
	onFileUpload?: (fileType: FileType) => Promise<string | null>;
	editable?: boolean;
	callAI?: (
		prompt: string,
		onChunk: (chunk: string) => void,
		onError: (error: Error) => void,
	) => Promise<void>;
}

export const createEditor = (props?: EdraEditorProps) =>
	useEditor({
		extensions: [
			...getDefaultExtensions({ undoRedo: !props?.collaborative }),
			...(props?.extensions || []),
			CodeBlockLowlight.configure({
				lowlight,
			}).extend({
				addNodeView() {
					return SvelteNodeViewRenderer(CodeBlock);
				},
			}),
			MediaPlaceholder(MediaPlaceholderComp).configure({
				onUpload: props?.onFileUpload,
			}),
			ImageExtended(ImageExtendedComp),
			VideoExtended(VideoExtendedComp),
			IFrameExtended(IFrameComp),
			Mermaid(MermaidComp),
			SlashCommand(SlashCommandComp),
			Callout(CalloutComp),
			AIHighlight.configure({
				callAI: props?.callAI || null,
			}),
			TableOfContents.configure({
				getIndex: getHierarchicalIndexes,
				scrollParent: () => {
					// In a browser context, try to find our specific scroll container
					if (typeof window !== "undefined") {
						return document.getElementById("editor-scroll-container") || window;
					}
					return undefined as any; // Type workaround for SSR
				},
				onUpdate: (indexes) => {
					setTocItems(indexes);
				},
			}),
		],
		onUpdate: props?.onUpdate || (() => {}),
		editable: props?.editable ?? true,
	});
