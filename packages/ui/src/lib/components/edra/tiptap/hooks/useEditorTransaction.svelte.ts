import type { Editor } from '../Editor.ts';
import type { Editor as CoreEditor} from '@tiptap/core'

/**
 * Svelte 5 rune-based hook that provides a reactive transaction counter.
 * Reading `version` inside a template expression creates a dependency
 * that re-evaluates on every editor transaction.
 */
export function useEditorTransaction(editor: Editor | CoreEditor) {
  let version = $state(0);

  $effect(() => {
    let raf = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        version++;
      });
    };
    editor.on('transaction', handler);
    return () => {
      cancelAnimationFrame(raf);
      editor.off('transaction', handler);
    };
  });

  return {
    get version() {
      return version;
    },
  };
}
