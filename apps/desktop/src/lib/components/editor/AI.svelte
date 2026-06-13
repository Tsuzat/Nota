<script lang="ts">
  import { SimpleToolTip, StreamDown } from "@lib/components/custom";
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
  import { generatePrompt } from "$lib/ai/prompts";
  import { getGlobalSettings } from "../settings";

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

  async function handleRefineSubmit(e: Event) {
    e.preventDefault();
    if (!refineValue || refineValue.trim().length === 0) return;
    const text = getSelectionText();
    if (!text) return;
    const previousResponse = aiResponse;
    try {
      aiResponse = ""; // Clear to trigger thinking/loading state
      const prompt = `Selected text:\n"""\n${text}\n"""\n\nPrevious AI response:\n"""\n${previousResponse}\n"""\n\nFollow-up request: ${refineValue}`;
      await generateAIContent(prompt);
    } catch (error) {
      aiState = AIState.Idle;
      console.error(error);
      toast.error("Something went wrong during refinement! Check console.");
    } finally {
      refineValue = "";
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
  class="bg-transparent flex max-h-120 max-w-3xl w-full flex-col p-0 transition-[height] duration-500 z-100"
  options={{
    strategy: "fixed",
    autoPlacement: {
      allowedPlacements: ["bottom", "top"],
      autoAlignment: true
    },
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
      class="shadow-2xl bg-popover/75 w-2xl border backdrop-blur-2xl rounded-xl flex flex-col overflow-hidden"
    >
      <!-- Input Area -->
      <div class="px-3 py-3">
        <textarea
          bind:value={inputValue}
          bind:this={inputTag}
          oninput={handleInput}
          rows="1"
          placeholder="Ask AI anything..."
          class="w-full bg-transparent border-0 outline-hidden text-[15px] resize-none h-auto max-h-40 placeholder:text-[#a0a0a0] text-[#ececec]"
        ></textarea>
      </div>

      {#if getSelectionText()?.trim()?.length && inputValue.trim()?.length === 0}
        <div class="h-px w-full bg-white/5"></div>
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
      <div
        transition:fade
        class="animated-gradient-border bg-[#1f1f1f] rounded-xl p-px w-[500px] overflow-hidden shadow-2xl"
      >
        <div
          class="bg-[#1f1f1f] flex items-center justify-between gap-3 rounded-xl p-4"
        >
          <div class="flex items-center gap-3">
            <icons.Sparkles
              class="size-5 text-[#a0a0a0] animate-[spin_3s_linear_infinite]"
            />
            <div class="flex flex-col gap-0.5">
              <span class="text-[15px] font-medium text-[#ececec]">
                Nota AI is writing...
              </span>
            </div>
          </div>
          <div class="flex h-5 items-center space-x-1">
            {#each Array(3) as _unused, i (i)}
              <div
                class="bg-white/40 h-1.5 w-1.5 animate-[bounce-dots_1.4s_ease-in-out_infinite] rounded-full"
                style:animation-delay="{i * 160}ms"
              ></div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <!-- Response state -->
      <div
        transition:fade
        class="bg-[#1f1f1f] border border-white/10 shadow-2xl rounded-xl w-[500px] flex flex-col overflow-hidden"
      >
        <!-- Streamed text content -->
        <div
          class="max-h-96 overflow-y-auto px-5 py-4 text-[15px] text-[#ececec] prose dark:prose-invert max-w-none"
        >
          <StreamDown content={aiResponse} />
        </div>

        <!-- Refinement input, only show when NOT generating -->
        {#if !generating}
          <div class="h-px w-full bg-white/5"></div>
          <form
            onsubmit={handleRefineSubmit}
            class="flex items-center gap-2.5 px-4 py-3 bg-black/20"
          >
            <icons.Sparkles class="size-4 text-[#a0a0a0] shrink-0" />
            <input
              bind:value={refineValue}
              bind:this={refineInputTag}
              onkeydown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRefineSubmit(e);
                }
              }}
              placeholder="Ask AI to edit or improve..."
              class="border-0 bg-transparent outline-none text-[14px] text-[#ececec] flex-1 placeholder:text-[#a0a0a0] focus:ring-0 p-0"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              class="size-6 rounded-md text-[#a0a0a0] hover:text-white hover:bg-white/10 shrink-0 cursor-pointer"
            >
              <icons.ArrowUp class="size-3.5" />
            </Button>
          </form>
        {:else}
          <!-- Generating loading indicator at the bottom -->
          <div class="h-px w-full bg-white/5"></div>
          <div
            class="flex items-center gap-2 px-5 py-3 bg-black/20 text-[13px] text-[#a0a0a0]"
          >
            <icons.Sparkles class="size-3.5 animate-pulse shrink-0" />
            <span>Generating response...</span>
          </div>
        {/if}

        <!-- Action bar -->
        <div class="h-px w-full bg-white/5"></div>
        <div class="flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1a]">
          <Button
            size="sm"
            onclick={replaceSelection}
            disabled={generating}
            class="gap-1.5 font-medium cursor-pointer bg-white text-black hover:bg-white/90 border-0 h-8"
          >
            <icons.Check class="size-4" />
            Replace selection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onclick={insertNext}
            disabled={generating}
            class="gap-1.5 cursor-pointer bg-transparent border-white/10 text-[#d4d4d4] hover:text-white hover:bg-white/10 h-8"
          >
            <icons.CornerDownLeft class="size-4" />
            Insert below
          </Button>
          <Button
            variant="outline"
            size="sm"
            onclick={discardChanges}
            disabled={generating}
            class="gap-1.5 cursor-pointer bg-transparent border-white/10 text-[#d4d4d4] hover:text-white hover:bg-white/10 h-8"
          >
            <icons.RotateCcw class="size-4" />
            Try again
          </Button>

          <div class="ml-auto flex items-center gap-1">
            <SimpleToolTip content="Copy to Clipboard">
              <Button
                variant="ghost"
                size="icon"
                class="size-8 rounded-md cursor-pointer text-[#a0a0a0] hover:text-white hover:bg-white/10"
                onclick={() => window.navigator.clipboard.writeText(aiResponse)}
              >
                <icons.Copy class="size-4" />
              </Button>
            </SimpleToolTip>
            <SimpleToolTip content="Discard Changes">
              <Button
                variant="ghost"
                size="icon"
                class="size-8 rounded-md cursor-pointer text-[#a0a0a0] hover:text-red-400 hover:bg-red-400/10"
                onclick={closeAI}
              >
                <icons.Trash2 class="size-4" />
              </Button>
            </SimpleToolTip>
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
      #3f3f3f,
      #6b6b6b,
      #a3a3a3,
      #3f3f3f
    );
    animation: rotate 3s linear infinite;
    border-radius: 12px !important;
  }
</style>
