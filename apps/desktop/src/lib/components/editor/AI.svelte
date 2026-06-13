<script lang="ts">
  import { StreamDown } from "@lib/components/custom";
  import BubbleMenu from "@nota/ui/edra/components/BubbleMenu.svelte";
  import { removeAIHighlight } from "@nota/ui/edra/extensions/AIHighLight.js";
  import type { Editor, ShouldShowProps } from "@nota/ui/edra/types.js";
  import { icons } from "@nota/ui/icons/index.js";
  import { Button } from "@nota/ui/shadcn/button";
  import { Kbd } from "@nota/ui/shadcn/kbd";
  import { toast } from "@nota/ui/shadcn/sonner";
  import { fade, slide } from "svelte/transition";
  import { callAI, callGemini } from "$lib/ai";
  import {
    CONTINUE_WRITING_PROMPT,
    FIX_GRAMMAR_PROMPT,
    MAKE_LONGER_PROMPT,
    MAKE_SHORTER_PROMPT,
    SOLVE_PROBLEM_PROMPT,
    SUMMARIZE_PROMPT,
    IMPROVE_WRITING_PROMPT,
    SIMPLIFY_LANGUAGE_PROMPT,
  } from "$lib/ai/commands";
  import { getGlobalSettings } from "../settings";
  import { Textarea } from "@lib/components/ui/textarea";

  interface Props {
    editor: Editor;
    parentElement?: HTMLElement;
  }
  const { editor, parentElement }: Props = $props();
  const settings = getGlobalSettings();
  let inputTag = $state<HTMLTextAreaElement | null>(null);
  let refineInputTag = $state<HTMLInputElement | null>(null);

  function shouldShow(props: ShouldShowProps) {
    if (!props.editor.isEditable || props.editor.isDestroyed) return false;
    const { view, editor } = props;
    if (!view || editor.view.dragging) {
      return false;
    }
    if (editor.isActive("ai-highlight")) {
      return true;
    }
    removeAIHighlight(editor);
    aiState = AIState.Idle;
    aiResponse = "";
    return false;
  }

  enum AIState {
    Idle = "Idle",
    Confirmation = "Confirmation",
  }

  let inputValue = $state("");
  let refineValue = $state("");
  let aiState = $state(AIState.Idle);
  let aiResponse = $state("");
  let activeOptionIndex = $state(0);
  let generating = $state(false);

  function getSelectionText(): string | undefined {
    const { from, to } = editor.view.state.selection;
    const slice = editor.view.state.doc.cut(from, to);
    if (editor.markdown) return editor.markdown.serialize(slice.toJSON());
  }

  async function processText(
    type:
      | "shorter"
      | "longer"
      | "summarize"
      | "grammer"
      | "continue"
      | "solve"
      | "improve"
      | "simplify",
  ) {
    const id = Symbol("AI_THINKING_TOAST").toString();
    const selectedText = getSelectionText();
    if (!selectedText || selectedText.trim().length === 0) {
      toast.error("Can not get the selected content from editor", { id });
      return;
    }
    try {
      let prompt = "";
      switch (type) {
        case "shorter":
          prompt = MAKE_SHORTER_PROMPT(selectedText);
          break;
        case "longer":
          prompt = MAKE_LONGER_PROMPT(selectedText);
          break;
        case "summarize":
          prompt = SUMMARIZE_PROMPT(selectedText);
          break;
        case "grammer":
          prompt = FIX_GRAMMAR_PROMPT(selectedText);
          break;
        case "continue":
          prompt = CONTINUE_WRITING_PROMPT(selectedText);
          break;
        case "solve":
          prompt = SOLVE_PROBLEM_PROMPT(selectedText);
          break;
        case "improve":
          prompt = IMPROVE_WRITING_PROMPT(selectedText);
          break;
        case "simplify":
          prompt = SIMPLIFY_LANGUAGE_PROMPT(selectedText);
          break;
      }
      aiState = AIState.Confirmation;
      await generateAIContent(prompt);
    } catch (error) {
      aiState = AIState.Idle;
      console.error(error);
      toast.error("Something went wrong! Check console.", { id });
    }
  }

  async function handleSubmit(e?: Event) {
    if (e) e.preventDefault();
    if (!inputValue || inputValue.trim().length === 0) return;
    const text = getSelectionText();
    if (!text) return;
    try {
      aiState = AIState.Confirmation;
      const prompt = `${text}\n\n\n${inputValue}`;
      await generateAIContent(prompt);
    } catch (error) {
      aiState = AIState.Idle;
      console.error(error);
      toast.error("Something went wrong! Check console.");
    } finally {
      inputValue = "";
      if (inputTag) inputTag.style.height = "auto"; // reset height
    }
  } 

  async function generateAIContent(prompt: string) {
    generating = true;
    try {
      if (settings.useMyOwnAI) {
        await callGemini(
          prompt,
          (chunk) => {
            aiResponse += chunk;
          },
          (error) => {
            toast.error("Something went wrong when calling AI.", {
              description: error.message,
            });
            console.error(error);
            aiState = AIState.Idle;
            aiResponse = "";
          },
        );
      } else {
        await callAI(
          prompt,
          (chunk) => {
            aiResponse += chunk;
          },
          (error) => {
            toast.error("Something went wrong when calling AI.", {
              description: error.message,
            });
            console.error(error);
            aiState = AIState.Idle;
            aiResponse = "";
          },
        );
      }
    } finally {
      generating = false;
    }
  }

  function replaceSelection() {
    const { from, to } = editor.view.state.selection;
    try {
      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, aiResponse, { contentType: "markdown" })
        .run();
    } catch (error) {
      console.error(error);
      toast.error(
        "Unable to insert the data. Copy content and paste manually.",
      );
    }
  }

  function insertNext() {
    const { to } = editor.view.state.selection;
    try {
      editor
        .chain()
        .focus()
        .insertContentAt(to + 1, aiResponse, { contentType: "markdown" })
        .run();
    } catch (error) {
      console.error(error);
      toast.error(
        "Unable to insert the data. Copy content and paste manually.",
      );
    }
  }

  function discardChanges() {
    aiResponse = "";
    aiState = AIState.Idle;
    setTimeout(() => {
      inputTag?.focus();
    }, 50);
  }

  function retry() {
    handleSubmit()
  }

  function closeAI() {
    removeAIHighlight(editor);
    aiState = AIState.Idle;
    aiResponse = "";
  }

  const quickActions = [
    {
      id: "improve",
      label: "Improve writing",
      icon: icons.Sparkles,
      handler: () => processText("improve"),
    },
    {
      id: "grammer",
      label: "Fix spelling & grammar",
      icon: icons.CheckCheck,
      handler: () => processText("grammer"),
    },
    {
      id: "shorter",
      label: "Make shorter",
      icon: icons.ArrowDownWideNarrow,
      handler: () => processText("shorter"),
    },
    {
      id: "longer",
      label: "Make longer",
      icon: icons.TextWrap,
      handler: () => processText("longer"),
    },
    {
      id: "simplify",
      label: "Simplify language",
      icon: icons.Feather,
      handler: () => processText("simplify"),
    },
    {
      id: "summarize",
      label: "Summarize",
      icon: icons.RefreshCcwDot,
      handler: () => processText("summarize"),
    },
    {
      id: "continue",
      label: "Continue writing",
      icon: icons.PenLine,
      handler: () => processText("continue"),
    },
    {
      id: "solve",
      label: "Solve problem",
      icon: icons.Brain,
      handler: () => processText("solve"),
    },
  ];

  function scrollActiveOptionIntoView() {
    setTimeout(() => {
      const activeEl = document.querySelector(".quick-action-active");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 0);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!editor.isActive("ai-highlight")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeAI();
      return;
    }

    if (aiState === AIState.Idle) {
      const showQuickActions =
        getSelectionText()?.trim()?.length && inputValue.trim()?.length === 0;
      if (showQuickActions) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          activeOptionIndex = (activeOptionIndex + 1) % quickActions.length;
          scrollActiveOptionIntoView();
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          activeOptionIndex =
            (activeOptionIndex - 1 + quickActions.length) % quickActions.length;
          scrollActiveOptionIntoView();
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const action = quickActions[activeOptionIndex];
          action.handler();
          return;
        }
      } else {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSubmit();
          return;
        }
      }
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = target.scrollHeight + "px";
  }
</script>

<svelte:document onkeydown={handleKeydown} />

{#snippet MenuButton(action: (typeof quickActions)[0], idx: number)}
  {@const Icon = action.icon}
  <button
    onclick={action.handler}
    class="focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 w-full transition-colors {activeOptionIndex === idx ? 'bg-accent text-accent-foreground quick-action-active' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
  >
    <Icon />
    <span class="flex-1 text-start font-medium ml-2">{action.label}</span>
    {#if activeOptionIndex === idx}
      <Kbd>Enter</Kbd>
    {/if}
  </button>
{/snippet}

<BubbleMenu
  {editor}
  pluginKey="edra-bubble-menu"
  {shouldShow}
  class="bg-popover/75 backdrop-blur-2xl rounded-lg flex max-h-120 max-w-3xl w-full flex-col p-0 transition-[height] duration-500 z-100"
  options={{
    strategy: "fixed",
    placement: "bottom",
    scrollTarget: parentElement,
    onShow() {
      activeOptionIndex = 0;
      inputTag?.focus();
    },
    onHide() {
      inputTag?.blur();
    },
  }}
>
  {#if aiState === AIState.Idle}
    <div
      class="shadow-2xl w-xl border backdrop-blur-2xl rounded-xl flex flex-col overflow-hidden"
    >
      <!-- Input Area -->
      <div class="px-3 py-3">
        <textarea
          bind:value={inputValue}
          bind:this={inputTag}
          oninput={handleInput}
          rows={1}
          placeholder="Ask AI anything..."
          class="w-full border-0 outline-hidden resize-none h-auto max-h-40"
        ></textarea>
      </div>

      {#if getSelectionText()?.trim()?.length && inputValue.trim()?.length === 0} 
        <!-- Quick Actions List -->
        <div
          transition:slide={{ axis: "y", duration: 250 }}
          class="flex flex-col p-1.5 max-h-72 overflow-y-auto"
        >
          {#each quickActions as action, idx (action.id)}
            {@render MenuButton(action, idx)}
          {/each}
        </div>
      {/if}
    </div>
  {:else if aiState === AIState.Confirmation}
    {#if aiResponse === ""}
      <!-- Thinking state -->
     <div transition:fade class="animated-gradient-border rounded-lg p-0.5">
        <div class="flex bg-popover items-center gap-2 rounded-lg p-2">
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
      <!-- Response state -->
      <div
        transition:fade
        class="border shadow-2xl rounded-xl w-full flex flex-col overflow-hidden"
      >
        <!-- Streamed text content -->
        <div
          class="max-h-96 overflow-y-auto p-2"
        >
          <StreamDown content={aiResponse} />
        </div>
        <!-- Action bar -->
        <div class="flex items-center border-t justify-between p-2">
          <!-- Left side: Replace, Insert, Copy -->
          <div class="flex items-center gap-1.5">
            <Button
              size="xs"
              onclick={replaceSelection}
              disabled={generating}
            >
              <icons.Check />
              Replace
            </Button>
            <Button
              variant="outline"
              size="xs"
              onclick={insertNext}
              disabled={generating}
            >
              <icons.CornerDownLeft  />
              Insert
            </Button>
            <Button
              variant="outline"
              size="xs"
              onclick={() => {
                window.navigator.clipboard.writeText(aiResponse);
                toast.success("Copied to clipboard");
              }}
              disabled={generating}
            >
              <icons.Copy />
              Copy
            </Button>
          </div>

          <!-- Right side: Retry, Discard -->
          <div class="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onclick={retry}
              disabled={generating}
            >
              <icons.RotateCcw />
              Retry
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onclick={discardChanges}
              disabled={generating}
            >
              <icons.Trash2 />
              Discard
            </Button>
          </div>
        </div>
      </div>
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
      #e50909,
      #c8b207,
      #e608e6,
      #6eec07
    );
    animation: rotate 3s linear infinite;
    border-radius: 12px !important;
  }
</style>
