import type { Content, Editor } from '@nota/ui/edra/types.js';
import { toast } from '@nota/ui/shadcn/sonner';
import { downloadDir, resolve } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import { type } from '@tauri-apps/plugin-os';

export const ISMACOS = type() === 'macos';
export const ISWINDOWS = type() === 'windows';

/**
 * Generates a new UUID that is not in the given array of UUIDs
 * @param uuids - Array of UUIDs
 * @returns - New UUID
 */
export const getNewUUID = (uuids: string[]) => {
  const threshold = 1000;
  const uuidsSet = new Set(uuids);
  let i = 0;
  while (i++ < threshold) {
    const uuid = crypto.randomUUID();
    if (!uuidsSet.has(uuid)) {
      return uuid;
    }
  }
  throw new Error('Could not generate a new UUID');
};

export const getKeyboardShortcut = (key: string, ctrl = false, shift = false, alt = false) => {
  const modifiers: string[] = [];
  if (ISMACOS) {
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

export function handleKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      history.back();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      history.forward();
    }
  }
}

export function timeAgo(date: string | number): string {
  const now = new Date();
  // If date is a number, assume it's Unix timestamp in seconds and convert to milliseconds
  const then = typeof date === 'number' ? new Date(date * 1000) : new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  // Just now: less than 60 seconds ago
  if (diffInSeconds < 60) {
    return diffInSeconds < 5 ? 'Just now' : `${diffInSeconds} sec${diffInSeconds !== 1 ? 's' : ''} ago`;
  }

  // Minutes ago: less than 60 minutes ago
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  // Hours ago: less than 24 hours ago
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  // Yesterday: if it was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    then.getDate() === yesterday.getDate() &&
    then.getMonth() === yesterday.getMonth() &&
    then.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  // Day of week: if it was within the last week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[then.getDay()];
  }

  // Date format: if it was more than a week ago
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[then.getMonth()]}, ${then.getDate()}`;
}

export async function writeStringToFile(data: string, name: string) {
  const path = await open({
    directory: true,
    multiple: false,
    canCreateDirectories: true,
    defaultPath: await downloadDir(),
  });
  if (path === null) return;
  const encoder = new TextEncoder();
  const fileData = encoder.encode(data);
  const resolvedPath = await resolve(path, name);
  toast.promise(writeFile(resolvedPath, fileData), {
    loading: 'Exporting data...',
    success: 'Exported Successfully',
    error: (err) => {
      console.error(err);
      return 'Something went wrong when exporting';
    },
    action: {
      label: 'Open',
      onClick: () => openPath(path),
    },
  });
}

export async function exportContent(editor: Editor, name: string, type: 'JSON' | 'HTML' | 'TEXT' | 'MD') {
  let content: string;
  switch (type) {
    case 'JSON':
      content = JSON.stringify(editor.getJSON(), undefined, 2);
      await writeStringToFile(content, `${name}.json`);
      break;
    case 'HTML':
      content = editor.getHTML();
      await writeStringToFile(content, `${name}.html`);
      break;
    case 'TEXT':
      content = editor.getText();
      await writeStringToFile(content, `${name}.text`);
      break;
    case 'MD':
      content = editor.getMarkdown();
      await writeStringToFile(content, `${name}.md`);
      break;
    default:
      toast.error('Invalid export type');
      return;
  }
}

export async function importNotes(editor?: Editor, returnData?: boolean) {
  if ((!editor || editor.isDestroyed || !editor.markdown) && !returnData) {
    console.error('Editor is not initialized or destroyed\n Editor = ', editor);
    toast.error('Can not intialize import. Try to restart.');
    return;
  }

  const extensions = ['json', 'md', 'markdown', 'html'];
  const path = await open({
    multiple: false,
    filters: [{ name: 'Nota Notes', extensions }],
    defaultPath: await downloadDir(),
  });

  if (!path) return;

  try {
    const extension = path.split('.').pop()?.toLowerCase();
    if (!extension || !extensions.includes(extension)) {
      toast.error(`Only ${extensions.join(', ')} files are supported.`);
      return;
    }

    const fileData = new TextDecoder().decode(await readFile(path));

    // Parse content based on file type
    let content: Content | undefined;
    switch (extension) {
      case 'json':
        content = JSON.parse(fileData) as Content;
        break;
      case 'md':
      case 'markdown':
        content = editor?.markdown?.parse(fileData) as Content | undefined;
        break;
      case 'html':
        // HTML is handled as a raw string by the editor
        content = fileData as unknown as Content;
        break;
    }

    if (!content) return;

    if (returnData) {
      const fileName = path
        .split(ISMACOS ? '/' : '\\')
        .pop()
        ?.split('.')[0];
      if (fileName) return { name: fileName, content };
      return;
    }

    // Insert content into the editor
    if (extension === 'html') {
      editor?.commands.setContent(fileData);
    } else {
      editor?.commands.setContent(content);
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong when importing the file.');
  }
}

/**
 * ! THIS TO BE DELETED EVENTUALLY AFTER 10 VERSIONS RELEASE - Added on 0.9.61-beta
 *
 * Recursively replaces all "inlineMathReplacer" node types with "inlineMath"
 * in a parsed TipTap/ProseMirror JSON content tree.
 *
 * @param parsedContent - The parsed content (TipTap JSON)
 * @returns An object with the fixed `content` and a `replaced` boolean
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fixMathReplacer(parsedContent: Content): {
  content: Content;
  replaced: boolean;
} {
  let replaced = false;
  let content = parsedContent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(node: any): any {
    if (node === null || node === undefined || typeof node !== 'object') return node;

    if (node.type === 'inlineMathReplacer') {
      node.type = 'inlineMath';
      replaced = true;
    }

    if (Array.isArray(node.content)) {
      node.content = node.content.map(walk);
    }

    return node;
  }

  // Content can be a top-level doc node or an array
  if (Array.isArray(content)) {
    content = content.map(walk) as Content;
  } else {
    walk(content);
  }

  return { content, replaced };
}
