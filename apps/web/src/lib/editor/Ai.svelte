<script lang="ts">
import { SimpleToolTip, StreamDown } from '@lib/components/custom/index.js';
import { getKeyboardShortcut } from '@lib/components/edra/utils';
import { Button } from '@lib/components/ui/button';
import { Textarea } from '@lib/components/ui/textarea';
import BubbleMenu from '@nota/ui/edra/components/BubbleMenu.svelte';
import { removeAIHighlight } from '@nota/ui/edra/extensions/AIHighLight.js';
import type { Editor, ShouldShowProps } from '@nota/ui/edra/types.js';
import { icons } from '@nota/ui/icons/index.js';
import { toast } from '@nota/ui/shadcn/sonner';
import { fade, slide } from 'svelte/transition';
import {
  CONTINUE_WRITING_PROMPT,
  callAI,
  FIX_GRAMMAR_PROMPT,
  MAKE_LONGER_PROMPT,
  MAKE_SHORTER_PROMPT,
  SOLVE_PROBLEM_PROMPT,
  SUMMARIZE_PROMPT,
} from './utils';

interface Props {
  editor: Editor;
}
const { editor }: Props = $props();
let inputTag = $state<HTMLTextAreaElement>();

function shouldShow(props: ShouldShowProps) {
  if (!props.editor.isEditable || props.editor.isDestroyed) return false;
  const { view, editor } = props;
  if (!view || editor.view.dragging) {
    return false;
  }
  if (editor.isActive('ai-highlight')) {
    return true;
  }
  removeAIHighlight(editor);
  aiState = AIState.Idle;
  aiResponse = '';
  return false;
}

enum AIState {
  Idle = 'Idle',
  Thinking = 'Thinking',
  Confirmation = 'Confirmation',
}

let inputValue = $state('');
let aiState = $state(AIState.Idle);
let aiResponse = $state('');

function getSelectionText(): string | undefined {
  const { from, to } = editor.view.state.selection;
  const slice = editor.view.state.doc.cut(from, to);
  if (editor.markdown) return editor.markdown.serialize(slice.toJSON());
}

async function processText(type: 'shorter' | 'longer' | 'summarize' | 'grammer' | 'continue' | 'solve') {
  const id = Symbol('AI_THINKING_TOAST').toString();
  const selectedText = getSelectionText();
  if (!selectedText || selectedText.trim().length === 0) {
    toast.error('Can not get the selected content from editor', { id });
    return;
  }
  try {
    let prompt = '';
    switch (type) {
      case 'shorter':
        prompt = MAKE_SHORTER_PROMPT(selectedText);
        break;
      case 'longer':
        prompt = MAKE_LONGER_PROMPT(selectedText);
        break;
      case 'summarize':
        prompt = SUMMARIZE_PROMPT(selectedText);
        break;
      case 'grammer':
        prompt = FIX_GRAMMAR_PROMPT(selectedText);
        break;
      case 'continue':
        prompt = CONTINUE_WRITING_PROMPT(selectedText);
        break;
      case 'solve':
        prompt = SOLVE_PROBLEM_PROMPT(selectedText);
        break;
    }
    aiState = AIState.Confirmation;
    await callAI(
      prompt,
      (chunk) => {
        aiResponse += chunk;
      },
      (error) => {
        toast.error('Something went wrong when calling AI.', {
          description: error.message,
        });
        console.error(error);
        aiState = AIState.Idle;
        aiResponse = '';
      }
    );
  } catch (error) {
    aiState = AIState.Idle;
    console.error(error);
    toast.error('Something went wrong! Check console.', { id });
  }
}

const makeTextShorter = () => processText('shorter');

const makeTextLonger = () => processText('longer');

const summarizeText = () => processText('summarize');

const checkGrammer = () => processText('grammer');

const continueWriting = () => processText('continue');

const solveProblem = () => processText('solve');

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!inputValue || inputValue.trim().length === 0) return;
  const text = getSelectionText();
  if (!text) return;
  try {
    aiState = AIState.Confirmation;
    const prompt = `${text}\n\n\n${inputValue}`;
    await callAI(
      prompt,
      (chunk) => {
        aiResponse += chunk;
      },
      (error) => {
        toast.error('Something went wrong when calling AI.', {
          description: error.message,
        });
        console.error(error);
        aiState = AIState.Idle;
        aiResponse = '';
      }
    );
  } catch (error) {
    aiState = AIState.Idle;
    console.error(error);
    toast.error('Something went wrong! Check console.');
  } finally {
    inputValue = '';
  }
}

function replaceSelection() {
  const { from, to } = editor.view.state.selection;
  try {
    editor.chain().focus().insertContentAt({ from, to }, aiResponse, { contentType: 'markdown' }).run();
  } catch (error) {
    console.error(error);
    toast.error('Unable to insert the data. Copy content and paste manually.');
  }
}

function insertNext() {
  const { to } = editor.view.state.selection;
  try {
    editor
      .chain()
      .focus()
      .insertContentAt(to + 1, aiResponse, { contentType: 'markdown' })
      .run();
  } catch (error) {
    console.error(error);
    toast.error('Unable to insert the data. Copy content and paste manually.');
  }
}

function discardChanges() {
  aiResponse = '';
  aiState = AIState.Idle;
}

function closeAI() {
  removeAIHighlight(editor);
  aiState = AIState.Idle;
  aiResponse = '';
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeAI();
  }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    handleSubmit(e);
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

<BubbleMenu
  {editor}
  pluginKey="edra-bubble-menu"
  {shouldShow}
  class="bg-transparent flex max-h-120 max-w-3xl w-full flex-col p-0 transition-[height] duration-500"
  options={{
    shift: {
      crossAxis: true,
      mainAxis: true,
    },
    strategy: "fixed",
    autoPlacement: {
      allowedPlacements: ["bottom", "top", "right", "left"],
    },
    onShow() {
      inputTag?.focus();
    },
    onHide() {
      inputTag?.blur();
    },
  }}
>
  {#if aiState === AIState.Idle}
    <form
      onsubmit={handleSubmit}
      class="flex bg-popover/75 backdrop-blur-2xl border rounded-lg items-center max-w-2xl justify-between min-w-xl p-1"
    >
      <Textarea
        bind:value={inputValue}
        bind:ref={inputTag}
        placeholder={`Ask AI anything and press ${getKeyboardShortcut("⏎", true)}`}
        class="border-0 p-2 w-2xl bg-transparent! max-w-3xl outline-0 text-sm resize-none h-auto ring-0!"
      />
      <Button type="submit" size="icon-sm" class="rounded-full">
        <icons.ArrowUp />
      </Button>
    </form>
    {#if getSelectionText()?.trim()?.length && inputValue.trim()?.length === 0}
      <div
        transition:slide={{ axis: "y", duration: 500 }}
        class="flex flex-col w-96 mx-auto bg-popover rounded-lg gap-1 border overflow-auto mt-2"
      >
        <div class="flex items-center justify-between">
          <small class="text-muted-foreground ml-4 mt-2 p-1 text-start"
            >Quick Actions</small
          >
          <!-- <span
            class="text-muted-foreground inline-flex items-center gap-1 mr-4 text-xs"
            >Use
            <icons.ArrowUpDown class="size-5 bg-muted p-0.5 rounded" /> to navigate</span
          > -->
        </div>
        <button
          title=""
          onclick={makeTextShorter}
          class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <icons.ArrowDownWideNarrow />
          <span>Make Shorter</span>
        </button>
        <button
          onclick={makeTextLonger}
          class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <icons.TextWrap />
          <span>Make Longer</span>
        </button>
        <button
          title=""
          onclick={summarizeText}
          class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <icons.RefreshCcwDot />
          <span>Summarize</span>
        </button>
        <button
          title=""
          onclick={continueWriting}
          class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <icons.PenLine />
          <span>Continue Writing</span>
        </button>
        <button
          title=""
          onclick={checkGrammer}
          class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <icons.CheckCheck />
          <span>Fix Grammer</span>
        </button>
        <button
          title=""
          onclick={solveProblem}
          class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <icons.Brain />
          <span>Solve Problem</span>
        </button>
      </div>
    {/if}
  {:else if aiState === AIState.Confirmation}
    {#if aiResponse === ""}
      <div transition:fade class="animated-gradient-border bg-popover rounded-lg p-0.5">
        <div class="bg-popover inline-flex items-center gap-2 rounded p-2">
          <icons.Sparkle class="size-4!" />
          <span
            class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-bold text-transparent"
          >
            AI is thinking</span
          >
          <div class="flex h-5 items-center space-x-1">
            {#each Array(3) as _unused, i (i)}
              <div
                class="bg-primary h-1 w-1 animate-[bounce-dots_1.4s_ease-in-out_infinite] rounded-full"
                style:animation-delay="{i * 160}ms"
              ></div>
            {/each}
            <span class="sr-only">Loading</span>
          </div>
        </div>
      </div>
    {:else}
      <div
        transition:fade
        class="flex items-center bg-popover border rounded-lg justify-between gap-2 px-2 py-1"
      >
        <small>Actions:</small>
        <SimpleToolTip content="Go Back to Options">
          <Button variant="secondary" size="sm" onclick={discardChanges}>
            <icons.ArrowLeft />
            Go Back
          </Button>
        </SimpleToolTip>
        <SimpleToolTip content="Copy Content to Clipboard">
          <Button
            variant="secondary"
            size="sm"
            onclick={() => window.navigator.clipboard.writeText(aiResponse)}
          >
            <icons.Clipboard />
            Copy
          </Button>
        </SimpleToolTip>
        <SimpleToolTip content="Replace Editor Selection">
          <Button variant="secondary" size="sm" onclick={replaceSelection}>
            <icons.CheckCheck />
            Replace Selection
          </Button>
        </SimpleToolTip>
        <SimpleToolTip content="Insert Content After Selection">
          <Button variant="secondary" size="sm" onclick={insertNext}>
            <icons.ArrowDown />
            Insert Next
          </Button>
        </SimpleToolTip>
        <SimpleToolTip content="Close AI Menu">
          <Button variant="destructive" size="sm" onclick={closeAI}>
            <icons.X />
            Close
          </Button>
        </SimpleToolTip>
      </div>
      <StreamDown content={aiResponse} class="w-full bg-popover/75 backdrop-blur-2xl rounded-lg border mt-2 overflow-auto px-4 py-2" />
    {/if}
  {/if}
</BubbleMenu>

<style>
  @property --angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
  @keyframes rotate {
    to {
      --angle: 360deg;
    }
  }
  .animated-gradient-border {
    background: conic-gradient(
      from var(--angle),
      #9229f3,
      #004cff,
      #00a930,
      #f7a312,
      #ff0a0a
    );
    animation: rotate 2s linear infinite;
    border-radius: 4px !important;
  }
</style>
