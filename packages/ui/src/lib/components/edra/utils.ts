import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';
import { toast } from 'svelte-sonner';
import { browser } from '$app/environment';

/**
 * Check if the current browser is in mac or not
 */
export const isMac = browser
  ? navigator.userAgent.includes('Macintosh') || navigator.userAgent.includes('Mac OS X')
  : false;

export const getKeyboardShortcut = (key: string, ctrl = false, shift = false, alt = false) => {
  const modifiers: string[] = [];
  if (isMac) {
    if (ctrl) modifiers.push('⌘');
    if (shift) modifiers.push('⇧');
    if (alt) modifiers.push('⌥');
  } else {
    if (ctrl) modifiers.push('Ctrl');
    if (shift) modifiers.push('Shift');
    if (alt) modifiers.push('Alt');
  }

  return [...modifiers, key].join(' ');
};

/**
 * Function to handle paste event of an image
 * @param editor Editor - editor instance
 * @param maxSize number - max size of the image to be pasted in MB, default is 2MB
 */
export function getHandlePasteImage(onDropOrPaste?: (file: File) => Promise<string>) {
  return (view: EditorView, event: ClipboardEvent) => {
    const item = event.clipboardData?.items[0];
    if (item?.type.indexOf('image') !== 0) {
      return;
    }
    const file = item.getAsFile();
    if (file === null || file.size === undefined) return;
    const id = toast.loading('Processing Pasted Image');
    onDropOrPaste?.(file)
      .then((src) => {
        const node = view.state.schema.nodes.image.create({ src });
        const transaction = view.state.tr.replaceSelectionWith(node);
        view.dispatch(transaction);
        toast.success('Uploaded Successfully', { id, duration: 300 });
      })
      .catch((error) => {
        console.error(error);
        toast.error('Something went wrong while pasting image', {
          id,
          duration: 300,
        });
      });
    return true;
  };
}

export function getHandleDropImage(onDropOrPaste?: (file: File) => Promise<string>) {
  return (view: EditorView, event: DragEvent) => {
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    const file = files[0];
    if (file === null || file.size === undefined) return;
    const id = toast.loading('Processing Dropped Image');
    onDropOrPaste?.(file)
      .then((src) => {
        const node = view.state.schema.nodes.image.create({ src });
        const transaction = view.state.tr.replaceSelectionWith(node);
        view.dispatch(transaction);
        toast.success('Uploaded Successfully', { id, duration: 300 });
      })
      .catch((error) => {
        console.error(error);
        toast.error('Something went wrong when handling dropped image', {
          id,
          duration: 300,
        });
      });
    return true;
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
        style: `--color: ${color}`,
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
      updateSelection: true,
    })
    .focus(selection.to)
    .run();
};

export const isURL = (str: string): boolean => {
  let isUrl = true;
  try {
    new URL(str);
    isUrl = true;
  } catch {
    isUrl = false;
  }
  return isUrl;
};

export const quickcolors = [
  { label: 'Default', value: '' },
  { label: 'Blue', value: '#0E0E99' },
  { label: 'Brown', value: '#7D0404' },
  { label: 'Green', value: '#077507' },
  { label: 'Grey', value: '#636262' },
  { label: 'Orange', value: '#A34603' },
  { label: 'Pink', value: '#DB0762' },
  { label: 'Purple', value: '#83069C' },
  { label: 'Red', value: '#B30707' },
  { label: 'Yellow', value: '#C4C404' },
];

export enum FileType {
  IMAGE = 'image/*',
  VIDEO = 'video/*',
  AUDIO = 'audio/*',
  DOCS = 'docs/*',
  UNKNOWN = 'unknown',
}

/**
 * Helper function to get web standard file extensions
 * @param fileType - FileType
 * @returns - Array of file extensions
 */
export const getFileTypeExtensions = (fileType: FileType) => {
  switch (fileType) {
    case FileType.IMAGE:
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    case FileType.VIDEO:
      return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    case FileType.AUDIO:
      return ['mp3', 'wav', 'ogg', 'flac', 'aac'];
    case FileType.DOCS:
      return ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'];
    case FileType.UNKNOWN:
      return [];
  }
};

export const getFileTypeFromExtension = (fileName: string): FileType => {
  const extension = fileName.toLowerCase().split('.').pop();

  if (!extension) return FileType.UNKNOWN;

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'];
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff'];
  const docsExtensions = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'pdf'];

  if (imageExtensions.includes(extension)) {
    return FileType.IMAGE;
  }
  if (videoExtensions.includes(extension)) {
    return FileType.VIDEO;
  }
  if (audioExtensions.includes(extension)) {
    return FileType.AUDIO;
  }
  if (docsExtensions.includes(extension)) {
    return FileType.DOCS;
  }
  return FileType.UNKNOWN;
};
