import type { EditorOptions } from '@tiptap/core';
import { browser } from '$app/environment';

import { Editor } from '../Editor.ts';

export const useEditor = (options: Partial<EditorOptions> = {}) => {
  if (!browser) return undefined;
  // NOTE: intentionally no `$effect` here. `$effect` inside a plain function
  // triggers `effect_orphan` when `createEditor`/`useEditor` is called
  // outside component init (e.g. from an async `loadData`/`setupEditor`).
  // Caller is responsible for `editor.destroy()` via `onDestroy`.
  return new Editor(options);
};
