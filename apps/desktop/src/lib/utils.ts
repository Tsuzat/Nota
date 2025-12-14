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
  const path = await open({
    multiple: false,
    filters: [
      {
        name: 'Nota Notes',
        extensions: ['json'],
      },
    ],
    defaultPath: await downloadDir(),
  });
  if (path) {
    try {
      const extension = path.split('.').pop();
      if (!extension || !['json'].includes(extension)) {
        toast.error('Only JSON files are supported.');
        return;
      }
      const data = await readFile(path);
      const decoder = new TextDecoder();
      const fileData = decoder.decode(data);
      const content = JSON.parse(fileData) as Content;
      if (returnData) {
        // file name
        const fileName = path
          .split(ISMACOS ? '/' : '\\')
          .pop()
          ?.split('.')[0];
        if (fileName) return { name: fileName, content };
      }
      editor?.commands.insertContent(content, { contentType: 'json' });
      // switch (extension) {
      // 	case 'json':
      // 		content = JSON.parse(fileData);
      // 		editor.commands.insertContent(content, { contentType: 'json' });
      // 		break;
      // 	case 'html':
      // 		content = fileData;
      // 		editor.commands.insertContent(content, { contentType: 'html' });
      // 		break;
      // 	default:
      // 		content = editor.markdown.parse(fileData);
      // 		editor.commands.insertContent(content, { contentType: 'json' });
      // 		break;
      // }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong when importing the file.');
    }
  }
}
