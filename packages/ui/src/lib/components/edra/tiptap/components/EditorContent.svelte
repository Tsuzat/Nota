<script lang="ts">
import { untrack } from 'svelte';
import type { Editor } from '../Editor.ts';

let { editor, class: className }: { editor: Editor | null; class: string } = $props();

let rootEl: HTMLDivElement | undefined = $state();
let mountedEditor: Editor | null = null;

$effect(() => {
  const ed = editor;
  const el = rootEl;
  if (!ed || !el) return;
  if (mountedEditor === ed) return;

  untrack(() => {
    if (!ed.view.dom?.parentNode) return;

    const element = el;

    // eslint-disable-next-line svelte/no-dom-manipulating
    el.append(...ed.view.dom.parentNode.childNodes);

    ed.setOptions({
      element,
    });

    ed.createNodeViews();
    mountedEditor = ed;
  });
});
</script>

<div bind:this={rootEl} class={className}></div>
