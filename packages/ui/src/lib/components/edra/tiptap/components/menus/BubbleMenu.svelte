<script lang="ts">
  import { untrack } from "svelte";
  import type { BubbleMenuPluginProps } from "@tiptap/extension-bubble-menu";
  import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
  import type { Editor } from "../../Editor.ts";
  import type { Snippet } from "svelte";
  interface Props {
    editor: Editor;
    pluginKey?: BubbleMenuPluginProps["pluginKey"];
    updateDelay?: BubbleMenuPluginProps["updateDelay"];
    resizeDelay?: BubbleMenuPluginProps["resizeDelay"];
    options?: BubbleMenuPluginProps["options"];
    appendTo?: BubbleMenuPluginProps["appendTo"];
    shouldShow?: BubbleMenuPluginProps["shouldShow"];
    getReferencedVirtualElement?: BubbleMenuPluginProps["getReferencedVirtualElement"];
    children: Snippet<[]>;
    class?: string;
    [key: string]: unknown;
  }

  let {
    editor,
    pluginKey = "bubbleMenu",
    updateDelay = undefined,
    resizeDelay = undefined,
    options = {},
    appendTo = undefined,
    shouldShow = null,
    getReferencedVirtualElement = undefined,
    children,
    class: className,
    ...rest
  }: Props = $props();

  let rootEl: HTMLDivElement | undefined = $state();
  let registeredKey: string | null = null;

  $effect(() => {
    const ed = editor;
    const el = rootEl;
    if (!ed || !el) return;
    if (registeredKey === String(pluginKey)) return;

    untrack(() => {
      el.style.visibility = "hidden";
      el.style.position = "absolute";
      el.remove();

      ed.registerPlugin(
        BubbleMenuPlugin({
          editor: ed,
          element: el,
          options,
          pluginKey,
          resizeDelay,
          appendTo,
          shouldShow,
          getReferencedVirtualElement,
          updateDelay,
        }),
      );
      registeredKey = String(pluginKey);
    });

    return () => {
      untrack(() => {
        try {
          ed.unregisterPlugin(pluginKey);
        } catch {}
        if (registeredKey === String(pluginKey)) registeredKey = null;
      });
    };
  });
</script>

<div bind:this={rootEl} class={className} {...rest}>
  {@render children()}
</div>
