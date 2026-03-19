<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from 'svelte-tiptap';
import mermaid from 'mermaid';
import * as Dialog from '@lib/components/ui/dialog';
import { Textarea } from '@lib/components/ui/textarea';
import { Button, buttonVariants } from '@lib/components/ui/button';
import Workflow from '@lucide/svelte/icons/workflow';
import { cn } from '@lib/utils';

const { node, editor, getPos }: NodeViewProps = $props();
const code = $derived(node.textContent);

let container: HTMLDivElement | null = $state(null);
let error: string | null = $state(null);
let localCode = $state(node.textContent);
let open = $state(false);
let debounceTimeout: any;

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

async function renderDiagram() {
  if (!container) return;

  const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
  try {
    const { svg, bindFunctions } = await mermaid.render(id, code);
    container.innerHTML = svg;
    if (bindFunctions) {
      bindFunctions(container);
    }
    error = null;
    container.classList.remove('ProseMirror-info');
    container.classList.remove('ProseMirror-error');
  } catch (err) {
    console.error('Mermaid render error:', err);
    error = (err as Error).message;
    if (container) {
      container.innerHTML = error;
      container.classList.remove('ProseMirror-info');
      container.classList.add('ProseMirror-error');
    }
    // Cleanup mermaid's generated SVG if it exists
    const svgEl = document.getElementById(id);
    if (svgEl) svgEl.remove();
  }
}

function debounceRender() {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    renderDiagram();
  }, 300);
}

onMount(() => {
  renderDiagram();
});

onDestroy(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
});

$effect(() => {
  if (code !== undefined) {
    debounceRender();
  }
});

function handleSave() {
  if (!localCode || localCode.trim() === '') {
    editor
      .chain()
      .focus()
      .deleteRange({
        from: getPos() ?? 0,
        to: (getPos() ?? 0) + node.nodeSize,
      })
      .run();
  } else {
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: getPos() ?? 0, to: (getPos() ?? 0) + node.nodeSize },
        {
          type: 'mermaid',
          content: [
            {
              type: 'text',
              text: localCode,
            },
          ],
        }
      )
      .run();
  }
  open = false;
}

// Update localCode when node content changes externally
$effect(() => {
  const currentCode = node.textContent;
  if (!open && localCode !== currentCode) {
    localCode = currentCode;
  }
});
</script>

<NodeViewWrapper
  class="mermaid-node-wrapper my-8 w-full flex justify-center group relative"
>
  <Dialog.Root bind:open>
    <Dialog.Trigger class="w-full">
      {#if !code || code.trim() === ""}
        <div
          class={cn(
            "flex items-center gap-2",
            "cursor-pointer justify-start overflow-x-auto p-4 rounded-lg bg-muted hover:bg-muted/50 transition-colors w-full flex min-h-12 items-center",
          )}
        >
          <Workflow class="w-4 h-4" />
          <span contenteditable={false}>Enter or paste the mermaid code</span>
        </div>
      {:else}
        <div
          bind:this={container}
          class="mermaid-container cursor-pointer overflow-x-auto p-4 rounded-lg hover:bg-muted/50 transition-colors w-full flex justify-center min-h-25 items-center"
        ></div>
      {/if}
    </Dialog.Trigger>
    <Dialog.Content
      onCloseAutoFocus={(e) => e.preventDefault()}
      class="min-w-fit p-4"
    >
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <Workflow class="w-4 h-4" />
          Edit Mermaid Diagram
        </Dialog.Title>
      </Dialog.Header>
      <Textarea
        bind:value={localCode}
        placeholder="Enter mermaid code here..."
        class="font-mono text-xs h-75 w-125 bg-muted/30 focus-visible:ring-1"
      />
      <Dialog.Footer>
        <Dialog.Close class={buttonVariants({ variant: "secondary" })}
          >Cancel</Dialog.Close
        >
        <Button onclick={handleSave}>Apply Changes</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</NodeViewWrapper>

<style>
  :global(.mermaid-container svg) {
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }
  :global(.ProseMirror-error) {
    color: hsl(var(--destructive));
    font-family: monospace;
    font-size: 0.75rem;
    white-space: pre-wrap;
  }
  :global(.ProseMirror-info) {
    color: hsl(var(--muted-foreground));
    font-style: italic;
  }
</style>
