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
} from '../tiptap/index.ts';
import { all, createLowlight } from 'lowlight';
import extensions from '../extensions.ts';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import CodeBlock from './components/CodeBlock.svelte';
import { MediaPlaceholder } from '../tiptap/extensions/MediaPlaceHolder.ts';
import MediaPlaceholderComp from './components/MediaPlaceHolder.svelte';
import ImageExtendedComp from './components/ImageExtended.svelte';
import VideoExtendedComp from './components/VideoExtended.svelte';
import IFrameComp from './components/IFrame.svelte';
import MermaidComp from './components/Mermaid.svelte';
import SlashCommandComp from './components/SlashCommand.svelte';
import FileHandler from '@tiptap/extension-file-handler';
import CalloutComp from './components/Callout.svelte';
import TableOfContents, { getHierarchicalIndexes } from '@tiptap/extension-table-of-contents';
import { setToC } from './toc.svelte';
import { ALLOWED_MAX_FILE_SIZE, FileType } from '../utils.ts';
import { toast } from 'svelte-sonner';

const lowlight = createLowlight(all);

export interface EdraEditorProps {
  onUpdate?: () => void;
  editable?: boolean;
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
  selectFile?: (fileType: FileType) => Promise<string | null>;
  getAssets?: (fileType: FileType) => Promise<string[]>;
  callAI?: (prompt: string, onChunk: (chunk: string) => void, onError: (error: Error) => void) => Promise<void>;
}

export const createEditor = (props?: EdraEditorProps) =>
  useEditor({
    editable: props?.editable,
    extensions: [
      ...extensions,
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return SvelteNodeViewRenderer(CodeBlock);
        },
      }),
      MediaPlaceholder(MediaPlaceholderComp).configure({
        onUpload: props?.onFileUpload,
        selectFile: props?.selectFile,
        getAssets: props?.getAssets,
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
        onUpdate: (content) => {
          setToC(content);
        },
        scrollParent: {
          addEventListener: (event: string, handler: EventListener) => {
            window.addEventListener(event, handler, { capture: true });
          },
          removeEventListener: (event: string, handler: EventListener) => {
            window.removeEventListener(event, handler, { capture: true });
          },
          get scrollY() {
            return document.querySelector('.tiptap')?.parentElement?.scrollTop ?? 0;
          },
        } as any,
      }),
      FileHandler.configure({
        onDrop: (currentEditor, files, pos) => {
          if (!props?.onFileUpload) return;
          (async () => {
            for (const file of files) {
              if (file.size > ALLOWED_MAX_FILE_SIZE) {
                toast.error(`File ${file.name} is too large (max 50MB).`);
                continue;
              }
              try {
                const uploadPromise = props.onFileUpload!(file);
                toast.promise(uploadPromise, {
                  loading: `Uploading ${file.name}...`,
                  success: `${file.name} uploaded successfully`,
                  error: `Failed to upload ${file.name}`,
                });
                const src = await uploadPromise;
                if (!src) continue;
                if (file.type.startsWith('image/')) {
                  currentEditor.chain().insertContentAt(pos, { type: 'image', attrs: { src } }).focus().run();
                } else if (file.type.startsWith('video/')) {
                  currentEditor.chain().insertContentAt(pos, { type: 'video', attrs: { src } }).focus().run();
                } else if (file.type.startsWith('audio/')) {
                  currentEditor.chain().insertContentAt(pos, { type: 'audio', attrs: { src } }).focus().run();
                } else {
                  toast.error('This file type is not supported yet.');
                }
              } catch (err) {
                console.error('Failed to upload dropped file:', err);
              }
            }
          })();
        },
        onPaste: (currentEditor, files) => {
          if (!props?.onFileUpload) return;
          (async () => {
            for (const file of files) {
              if (file.size > ALLOWED_MAX_FILE_SIZE) {
                toast.error(`File ${file.name} is too large (max 50MB).`);
                continue;
              }
              try {
                const uploadPromise = props.onFileUpload!(file);
                toast.promise(uploadPromise, {
                  loading: `Uploading ${file.name}...`,
                  success: `${file.name} uploaded successfully`,
                  error: `Failed to upload ${file.name}`,
                });
                const src = await uploadPromise;
                if (!src) continue;
                if (file.type.startsWith('image/')) {
                  currentEditor.chain().setImage({ src }).focus().run();
                } else if (file.type.startsWith('video/')) {
                  currentEditor.chain().setVideo({ src }).focus().run();
                } else if (file.type.startsWith('audio/')) {
                  currentEditor.chain().setAudio({ src }).focus().run();
                } else {
                  toast.error('This file type is not supported yet.');
                }
              } catch (err) {
                console.error('Failed to upload pasted file:', err);
              }
            }
          })();
        },
      }),
    ],
    onUpdate: props?.onUpdate || (() => {}),
  });
