<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from 'svelte-tiptap';
import mermaid from 'mermaid';
import * as Select from '@lib/components/ui/select';
import { Textarea } from '@lib/components/ui/textarea';
import { Button } from '@lib/components/ui/button';
import Workflow from '@lucide/svelte/icons/workflow';
import Pencil from '@lucide/svelte/icons/pencil';
import { cn } from '@lib/utils';

const { node, editor, getPos }: NodeViewProps = $props();
const code = $derived(node.textContent);

let container: HTMLDivElement | null = $state(null);
let error: string | null = $state(null);
let localCode = $derived(node.textContent);
let isEditing = $state(false);
let mode = $state('both'); // 'both' | 'code' | 'image'
let debounceTimeout: any;

const modes = [
  { value: 'both', label: 'Both' },
  { value: 'code', label: 'Code' },
  { value: 'image', label: 'Image' },
];

let dialogContainer: HTMLDivElement | null = $state(null);

async function renderDiagram(containerEl: HTMLDivElement | null, sourceCode: string) {
  if (!containerEl) return;

  const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
  try {
    const { svg, bindFunctions } = await mermaid.render(id, sourceCode);
    containerEl.innerHTML = svg;
    if (bindFunctions) {
      bindFunctions(containerEl);
    }
    error = null;
    containerEl.classList.remove('ProseMirror-info');
    containerEl.classList.remove('ProseMirror-error');
  } catch (err) {
    console.error('Mermaid render error:', err);
    error = (err as Error).message;
    if (containerEl) {
      containerEl.innerHTML = error;
      containerEl.classList.remove('ProseMirror-info');
      containerEl.classList.add('ProseMirror-error');
    }
    // Cleanup mermaid's generated SVG if it exists
    const svgEl = document.getElementById(id);
    if (svgEl) svgEl.remove();
  }
}

function debounceRender(containerEl: HTMLDivElement | null, sourceCode: string) {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    renderDiagram(containerEl, sourceCode);
  }, 500);
}

onMount(() => {
  renderDiagram(container, code);
});

onDestroy(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
});

$effect(() => {
  if (code !== undefined) {
    debounceRender(container, code);
  }
});

$effect(() => {
  if (isEditing && (mode === 'both' || mode === 'image') && localCode !== undefined && dialogContainer) {
    renderDiagram(dialogContainer, localCode);
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
  isEditing = false;
}

function enterEditMode() {
  if (!editor.isEditable) return;
  localCode = code;
  isEditing = true;
}

// Update localCode when node content changes externally
$effect(() => {
  const currentCode = node.textContent;
  if (!isEditing && localCode !== currentCode) {
    localCode = currentCode;
  }
});
</script>

<NodeViewWrapper
  class="mermaid-node-wrapper my-4! w-full flex flex-col items-center group relative border rounded-lg overflow-hidden transition-all duration-300"
  contenteditable={false}
>
  {#if isEditing}
    <div class="w-full h-125 flex flex-col bg-background">
      <div
        class="px-4 py-2 border-b flex flex-row items-center justify-between space-y-0"
      >
        <div class="flex items-center gap-2">
          <Workflow class="w-4 h-4 text-muted-foreground" />
          <span
            class="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >Mermaid Editor</span
          >
        </div>
        <div class="flex items-center gap-2">
          <Select.Root type="single" bind:value={mode}>
            <Select.Trigger class="h-8 w-25 text-xs">
              {modes.find((m) => m.value === mode)?.label}
            </Select.Trigger>
            <Select.Content>
              {#each modes as m (m.value)}
                <Select.Item value={m.value} label={m.label} class="text-xs">
                  {m.label}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          <Button
            size="sm"
            variant="ghost"
            class="h-8 text-xs"
            onclick={() => (isEditing = false)}>Cancel</Button
          >
          <Button size="sm" class="h-8 text-xs" onclick={handleSave}
            >Apply</Button
          >
        </div>
      </div>
      <div class="flex-1 flex overflow-hidden">
        {#if mode === "both" || mode === "code"}
          <div
            class={cn(
              "flex-1 h-full bg-muted dark:bg-muted/20 relative",
              mode === "both" ? "border-r" : "",
            )}
          >
            <Textarea
              bind:value={localCode}
              placeholder="Enter mermaid code here..."
              class="mermaid-code-editor w-full h-full p-4 rounded-none font-mono text-sm text-muted-foreground border-none focus-visible:ring-0 resize-none outline-none"
            />
          </div>
        {/if}
        {#if mode === "both" || mode === "image"}
          <div
            class="flex-1 size-full bg-background overflow-auto flex items-center justify-center p-8"
          >
            <div
              bind:this={dialogContainer}
              class="mermaid-preview flex items-center size-full justify-center overflow-auto [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
            ></div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="w-full relative group/preview cursor-pointer">
      {#if !code || code.trim() === ""}
        <button
          class={cn(
            "flex items-center gap-2 justify-start overflow-x-auto p-4 rounded-lg bg-muted hover:bg-muted/50 transition-colors w-full min-h-12",
          )}
          onclick={enterEditMode}
        >
          <Workflow class="w-4 h-4" />

          <span contenteditable={false}>Click to enter mermaid code</span>
        </button>
      {:else}
        <div
          bind:this={container}
          class="mermaid-container overflow-x-auto p-4 transition-colors w-full flex justify-center min-h-25 items-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
        ></div>
        <div
          class="absolute top-2 right-2 opacity-0 group-hover/preview:opacity-100 transition-opacity"
        >
          <Button
            size="icon-sm"
            variant="secondary"
            class="h-8 w-8 rounded-full shadow-lg"
            onclick={enterEditMode}
          >
            <Pencil class="h-3.5 w-3.5" />
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</NodeViewWrapper>

<style>
  .mermaid-code-editor::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .mermaid-code-editor::-webkit-scrollbar-track {
    background: transparent;
  }
  .mermaid-code-editor::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }
  .mermaid-code-editor::-webkit-scrollbar-thumb:hover {
    background: #444;
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
