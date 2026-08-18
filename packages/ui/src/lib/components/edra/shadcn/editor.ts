import type { Extensions } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TableOfContents, {
	getHierarchicalIndexes,
} from "@tiptap/extension-table-of-contents";
import { all, createLowlight } from "lowlight";
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
import CalloutComp from "./components/Callout.svelte";
import CodeBlock from "./components/CodeBlock.svelte";
import IFrameComp from "./components/IFrame.svelte";
import ImageExtendedComp from "./components/ImageExtended.svelte";
import MediaPlaceholderComp from "./components/MediaPlaceHolder.svelte";
import MermaidComp from "./components/Mermaid.svelte";
import SlashCommandComp from "./components/SlashCommand.svelte";
import VideoExtendedComp from "./components/VideoExtended.svelte";
import { setTocItems } from "./toc.svelte";

const lowlight = createLowlight(all);

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
	 * @param file The file to be uploaded.
	 * @returns A promise resolving to the uploaded file's URL.
	 */
	onFileUpload?: (file: File) => Promise<string>;
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
				onUpdate: (indexes) => {
					setTocItems(indexes);
				},
			}),
		],
		onUpdate: props?.onUpdate || (() => {}),
	});
