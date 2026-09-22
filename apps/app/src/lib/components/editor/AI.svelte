<script lang="ts">
import ArrowDownWideNarrow from "@lucide/svelte/icons/arrow-down-wide-narrow";
import Brain from "@lucide/svelte/icons/brain";
import Check from "@lucide/svelte/icons/check";
import CheckCheck from "@lucide/svelte/icons/check-check";
import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
import Copy from "@lucide/svelte/icons/copy";
import CornerDownLeft from "@lucide/svelte/icons/corner-down-left";
import Feather from "@lucide/svelte/icons/feather";
import FileText from "@lucide/svelte/icons/file-text";
import Info from "@lucide/svelte/icons/info";
import RefreshCcwDot from "@lucide/svelte/icons/refresh-ccw-dot";
import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
import Send from "@lucide/svelte/icons/send";
import Sparkle from "@lucide/svelte/icons/sparkle";
import Sparkles from "@lucide/svelte/icons/sparkles";
import Square from "@lucide/svelte/icons/square";
import TextWrap from "@lucide/svelte/icons/text-wrap";
import Trash2 from "@lucide/svelte/icons/trash-2";
import type { SelectableModel } from "@nota/ai";
import { toast } from "@nota/ui";
import {
	AIState,
	CONTINUE_WRITING_PROMPT,
	FIX_GRAMMAR_PROMPT,
	IMPROVE_WRITING_PROMPT,
	MAKE_LONGER_PROMPT,
	MAKE_SHORTER_PROMPT,
	SIMPLIFY_LANGUAGE_PROMPT,
	SOLVE_PROBLEM_PROMPT,
	SUMMARIZE_PROMPT,
} from "@nota/ui/edra/commands/index.js";
import {
	BubbleMenu,
	getEditor,
	removeAIHighlight,
	useEditorTransaction,
} from "@nota/ui/edra/tiptap/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Command from "@nota/ui/shadcn/command/index.js";
import * as Popover from "@nota/ui/shadcn/popover/index.js";
import * as Tooltip from "@nota/ui/shadcn/tooltip/index.js";
import { cn } from "@nota/ui/utils";
import { onMount } from "svelte";
import { fade, slide } from "svelte/transition";
import { getGlobalSettings } from "#lib/components/dialogs/index.ts";
import { callAI, getUserModels } from "#lib/data/local/ai/ai.js";

interface Props {
	noteId?: string;
}

const { noteId }: Props = $props();

const editor = getEditor();
const transaction = useEditorTransaction(editor);
const settings = getGlobalSettings();

let inputTag = $state<HTMLTextAreaElement | null>(null);
let inputValue = $state("");
let aiState = $state<AIState>(AIState.Idle);
let aiResponse = $state("");
let activeOptionIndex = $state(0);
let includeEntireNote = $state(false);
let modelSelectorOpen = $state(false);

// Models list populated from app's user settings
let availableModels = $state<SelectableModel[]>([]);

// Position tracking for inline editor streaming
let originalFrom = $state(0);
let aiContentFrom = $state(0);
let aiContentTo = $state(0);
let lastPrompt = $state("");
let updateTimer: ReturnType<typeof setTimeout> | null = null;
let activeAbortController = $state<AbortController | null>(null);

onMount(async () => {
	availableModels = await getUserModels();
});

$effect(() => {
	// Re-fetch models if the AI mode or provider changes in settings
	void settings.aiMode;
	void settings.aiProvider;
	getUserModels().then((models) => {
		availableModels = models;
	});
});

const selectedModelId = $derived(
	settings.aiProvider || availableModels[0]?.id || "gpt-5.6-luna",
);

const selectedModel = $derived<SelectableModel>(
	availableModels.find((m) => m.id === selectedModelId) ?? {
		id: selectedModelId,
		displayName: selectedModelId,
		provider: "openai",
		modelString: selectedModelId,
		contextWindow: 4096,
		isCustom: false,
	},
);

function selectModel(id: string) {
	settings.aiProvider = id;
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("ai_provider", id);
	}
	modelSelectorOpen = false;
}

function getFullNoteMarkdown(): string {
	try {
		if (typeof editor.getMarkdown === "function") {
			return editor.getMarkdown() || "";
		}
		if (editor.markdown && typeof editor.markdown.serialize === "function") {
			return editor.markdown.serialize(editor.state.doc.toJSON()) || "";
		}
		return editor.state.doc.textContent || "";
	} catch {
		return editor.state.doc.textContent || "";
	}
}

function isAIActive(): boolean {
	void transaction.version;
	return editor.isActive("ai-highlight");
}

function getAIHighlightedText(): string | undefined {
	void transaction.version;
	let range = { from: -1, to: -1 };
	editor.state.doc.descendants((node, pos) => {
		if (node.marks.some((mark) => mark.type.name === "ai-highlight")) {
			if (range.from === -1) range.from = pos;
			range.to = pos + node.nodeSize;
		}
	});
	if (range.from === -1 || range.to === -1) return undefined;
	const slice = editor.view.state.doc.cut(range.from, range.to);
	if (editor.markdown) return editor.markdown.serialize(slice.toJSON());
	return editor.state.doc.textBetween(range.from, range.to);
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
	const selectedText = getAIHighlightedText();
	if (!selectedText || selectedText.trim().length === 0) {
		toast.error("Cannot get selected content from editor.");
		return;
	}

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

	if (includeEntireNote) {
		const fullNote = getFullNoteMarkdown();
		if (fullNote) {
			prompt = `[DOCUMENT_CONTEXT]:\n${fullNote}\n\n${prompt}`;
		}
	}

	await generateAIContent(prompt);
}

async function handleSubmit(e?: Event) {
	if (e) e.preventDefault();
	if (!inputValue || inputValue.trim().length === 0) return;
	const text = getAIHighlightedText() || "";

	const fullNote = includeEntireNote ? getFullNoteMarkdown() : "";
	let prompt: string;
	if (fullNote && text) {
		prompt = `[DOCUMENT_CONTEXT]:\n${fullNote}\n\n[SELECTED_TEXT]:\n${text}\n\n[USER_PROMPT]:\n${inputValue}`;
	} else if (fullNote) {
		prompt = `[DOCUMENT_CONTEXT]:\n${fullNote}\n\n[USER_PROMPT]:\n${inputValue}`;
	} else if (text) {
		prompt = `${text}\n\n\n${inputValue}`;
	} else {
		prompt = inputValue;
	}

	inputValue = "";
	if (inputTag) inputTag.style.height = "auto";
	await generateAIContent(prompt);
}

async function generateAIContent(prompt: string, isRetry = false) {
	void transaction.version;
	aiState = AIState.Generating;
	lastPrompt = prompt;
	aiResponse = "";

	const controller = new AbortController();
	activeAbortController = controller;

	if (!isRetry) {
		// Save current selection positions
		const { from, to } = editor.state.selection;
		originalFrom = from;

		// Calculate insertion position: right after the top-level block containing the selection end
		const to_ = editor.state.doc.resolve(to);
		const depth = Math.min(to_.depth, 1) || 1;
		aiContentFrom = to_.after(depth);
		aiContentTo = aiContentFrom;
	} else {
		aiContentTo = aiContentFrom;
	}

	try {
		const onChunk = (chunk: string) => {
			if (controller.signal.aborted) return;
			aiResponse += chunk;
			scheduleEditorUpdate();
		};

		const onError = (error: Error) => {
			if (controller.signal.aborted) return;
			toast.error("Something went wrong when calling AI.", {
				description: error.message,
			});
			console.error(error);
			cleanupAIContent();
			removeAIHighlight(editor);
			aiState = AIState.Idle;
			aiResponse = "";
		};

		await callAI(prompt, onChunk, onError, noteId);
		flushEditorUpdate();

		if (!controller.signal.aborted) {
			aiState = AIState.Confirmation;
		}
	} catch (err: unknown) {
		if (!controller.signal.aborted) {
			const message = err instanceof Error ? err.message : String(err);
			toast.error("Something went wrong when calling AI.", {
				description: message,
			});
			console.error(err);
			cleanupAIContent();
			removeAIHighlight(editor);
			aiState = AIState.Idle;
			aiResponse = "";
		}
	} finally {
		activeAbortController = null;
	}
}

function stopGeneration() {
	if (activeAbortController) {
		activeAbortController.abort();
		activeAbortController = null;
	}
	flushEditorUpdate();
	if (aiResponse.trim().length > 0) {
		aiState = AIState.Confirmation;
	} else {
		cleanupAIContent();
		removeAIHighlight(editor);
		aiState = AIState.Idle;
	}
}

/** Throttle editor updates to ~100ms to avoid excessive transactions */
function scheduleEditorUpdate() {
	if (updateTimer) return;
	updateTimer = setTimeout(() => {
		flushEditorUpdate();
		updateTimer = null;
	}, 100);
}

/** Insert or replace the AI content region in the editor with the accumulated response */
function flushEditorUpdate() {
	void transaction.version;
	if (updateTimer) {
		clearTimeout(updateTimer);
		updateTimer = null;
	}
	if (!aiResponse) return;

	try {
		const oldDocSize = editor.state.doc.content.size;

		if (aiContentFrom >= aiContentTo) {
			// First insert — no existing AI content to replace
			editor
				.chain()
				.command(({ tr }) => {
					tr.setMeta("addToHistory", false);
					return true;
				})
				.insertContentAt(aiContentFrom, aiResponse, {
					contentType: "markdown",
				})
				.run();
		} else {
			// Replace existing AI content with the updated response
			editor
				.chain()
				.command(({ tr }) => {
					tr.setMeta("addToHistory", false);
					return true;
				})
				.insertContentAt({ from: aiContentFrom, to: aiContentTo }, aiResponse, {
					contentType: "markdown",
				})
				.run();
		}

		const newDocSize = editor.state.doc.content.size;
		aiContentTo = newDocSize - (oldDocSize - aiContentTo);

		// Highlight the AI-generated content with a distinct color
		const tr = editor.state.tr;
		tr.setMeta("addToHistory", false);
		tr.addMark(
			aiContentFrom,
			aiContentTo,
			editor.state.schema.marks["ai-highlight"].create({
				color: "var(--color-muted)",
			}),
		);
		editor.view.dispatch(tr);

		// Move cursor to end of AI content so bubble menu follows it
		if (aiContentTo > 1) {
			editor.commands.setTextSelection(aiContentTo - 1);
		}
	} catch (error) {
		console.error("Error updating editor with AI content:", error);
	}
}

/** Remove AI-generated content from the editor */
function cleanupAIContent() {
	void transaction.version;
	if (aiContentFrom < aiContentTo) {
		try {
			editor
				.chain()
				.command(({ tr }) => {
					tr.setMeta("addToHistory", false);
					return true;
				})
				.deleteRange({ from: aiContentFrom, to: aiContentTo })
				.run();
			aiContentTo = aiContentFrom;
		} catch (error) {
			console.error("Error cleaning up AI content:", error);
		}
	}
}

/** Replace: delete original selection, keep AI text */
function replaceSelection() {
	void transaction.version;
	try {
		const response = aiResponse;

		// Delete everything from original selection start to AI content end
		editor.chain().deleteRange({ from: originalFrom, to: aiContentTo }).run();

		// Insert the AI response at the original position
		editor
			.chain()
			.insertContentAt(originalFrom, response, {
				contentType: "markdown",
			})
			.run();

		removeAIHighlight(editor);
		aiState = AIState.Idle;
		aiResponse = "";
	} catch (error) {
		console.error(error);
		toast.error("Unable to replace. Copy content and paste manually.");
	}
}

/** Insert below: AI text is already below the selection — just accept */
function insertNext() {
	removeAIHighlight(editor);
	aiState = AIState.Idle;
	aiResponse = "";
}

/** Copy AI response to clipboard */
function copyToClipboard() {
	window.navigator.clipboard.writeText(aiResponse);
	toast.success("Copied to clipboard");
}

/** Retry: delete AI content, re-run with same prompt */
function retry() {
	cleanupAIContent();
	aiResponse = "";
	if (lastPrompt) {
		generateAIContent(lastPrompt, true);
	}
}

/** Discard: delete AI content, keep original, reset */
function discardChanges() {
	cleanupAIContent();
	removeAIHighlight(editor);
	aiState = AIState.Idle;
	aiResponse = "";
}

/** Close AI: full cleanup */
function closeAI() {
	if (activeAbortController) {
		activeAbortController.abort();
		activeAbortController = null;
	}
	cleanupAIContent();
	removeAIHighlight(editor);
	aiState = AIState.Idle;
	aiResponse = "";
	lastPrompt = "";
}

const quickActions = [
	{
		id: "improve",
		label: "Improve writing",
		icon: Sparkles,
		handler: () => processText("improve"),
	},
	{
		id: "grammer",
		label: "Fix spelling & grammar",
		icon: CheckCheck,
		handler: () => processText("grammer"),
	},
	{
		id: "shorter",
		label: "Make shorter",
		icon: ArrowDownWideNarrow,
		handler: () => processText("shorter"),
	},
	{
		id: "longer",
		label: "Make longer",
		icon: TextWrap,
		handler: () => processText("longer"),
	},
	{
		id: "simplify",
		label: "Simplify language",
		icon: Feather,
		handler: () => processText("simplify"),
	},
	{
		id: "summarize",
		label: "Summarize",
		icon: RefreshCcwDot,
		handler: () => processText("summarize"),
	},
];

function scrollActiveOptionIntoView() {
	setTimeout(() => {
		const activeEl = document.querySelector(".quick-action-active");
		if (activeEl) {
			activeEl.scrollIntoView({ block: "nearest" });
		}
	}, 0);
}

function handleKeydown(event: KeyboardEvent) {
	if (!isAIActive() && aiState === AIState.Idle) return;

	if (event.key === "Escape") {
		event.preventDefault();
		if (modelSelectorOpen) {
			modelSelectorOpen = false;
			return;
		}
		if (aiState === AIState.Generating) {
			stopGeneration();
			return;
		}
		if (aiState === AIState.Confirmation) {
			discardChanges();
			return;
		}
		closeAI();
		return;
	}

	if (aiState === AIState.Idle) {
		if (modelSelectorOpen) return;

		const showQuickActions = isAIActive() && inputValue.trim().length === 0;
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
				quickActions[activeOptionIndex]?.handler();
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
	target.style.height = `${target.scrollHeight}px`;
}
</script>

<svelte:document onkeydown={handleKeydown} />

{#snippet MenuButton(action: (typeof quickActions)[0], idx: number)}
  {@const Icon = action.icon}
  <button
    onclick={action.handler}
    class="group/dropdown-menu-item relative flex w-full cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-hidden transition-colors select-none focus:bg-accent focus:text-accent-foreground {activeOptionIndex ===
    idx
      ? 'quick-action-active bg-accent text-accent-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
  >
    <Icon class="size-4 shrink-0" />
    <span class="ml-2 flex-1 text-start">{action.label}</span>
    {#if activeOptionIndex === idx}
      <span class="rounded-sm bg-muted/75 px-1 text-[10px] text-muted-foreground">Enter</span>
    {/if}
  </button>
{/snippet}

<BubbleMenu
  {editor}
  pluginKey="ai-bubble-menu"
  shouldShow={(props) => {
    const { editor: propsEditor, view } = props;
    if (!propsEditor || !propsEditor.isEditable || propsEditor.isDestroyed) {
      return false;
    }
    if (!view || propsEditor.view.dragging) return false;

    // Always keep menu visible during generation and confirmation review
    if (aiState === AIState.Generating || aiState === AIState.Confirmation) {
      return true;
    }

    // In Idle mode, display whenever the selection has the AI highlight mark
    return isAIActive();
  }}
  class="absolute z-100 flex max-h-120 max-w-3xl flex-col rounded-lg bg-popover/85 p-0 backdrop-blur-2xl shadow-2xl transition-[height] duration-300"
  options={{
    strategy: "absolute",
    autoPlacement: {
      allowedPlacements: ["bottom-start", "top-start"],
    },
    scrollTarget: editor.view.dom.parentElement ?? window,
    onShow() {
      activeOptionIndex = 0;
      inputTag?.focus({ preventScroll: true });
    },
    onHide() {
      inputTag?.blur();
      modelSelectorOpen = false;
      if (aiState === AIState.Idle) {
        removeAIHighlight(editor);
        aiResponse = "";
      }
    },
  }}
>
  {#if aiState === AIState.Idle}
    <div
      class="flex w-xl flex-col overflow-hidden rounded-xl border bg-popover/95 shadow-2xl backdrop-blur-2xl"
    >
      <!-- Input Area -->
      <form class="flex items-start px-3 py-3" onsubmit={handleSubmit}>
        <textarea
          bind:value={inputValue}
          bind:this={inputTag}
          oninput={handleInput}
          rows={1}
          placeholder="Ask AI anything..."
          class="h-auto max-h-40 w-full resize-none border-0 bg-transparent outline-hidden text-sm placeholder:text-muted-foreground"
        ></textarea>
        <Button type="submit" size="icon" class="size-8 rounded-full shrink-0 ml-2">
          <Send class="size-3.5" />
        </Button>
      </form>

      <!-- Bottom Bar: Model Selector & Context Toggle -->
      <div
        class="flex items-center justify-between px-3 py-1.5 border-t border-border/40 text-xs text-muted-foreground bg-muted/20"
      >
        <!-- Model Selector Popover -->
        <Popover.Root bind:open={modelSelectorOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <button
                {...props}
                type="button"
                class="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors text-foreground font-medium text-xs cursor-pointer"
              >
                {#if selectedModel.providerIcon}
                  <img
                    src={typeof selectedModel.providerIcon === "string"
                      ? selectedModel.providerIcon
                      : selectedModel.providerIcon.light}
                    alt={selectedModel.provider || "AI"}
                    class="size-4 object-contain"
                  />
                {:else}
                  <Brain class="size-4 text-primary" />
                {/if}
                <span class="truncate max-w-35">{selectedModel.displayName}</span>
                <ChevronsUpDown class="size-3 opacity-50 ml-0.5" />
              </button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-fit p-0 z-100!" align="start" side="bottom">
            <Command.Root>
              <Command.Input placeholder="Search models..." />
              <Command.List class="max-h-64 overflow-y-auto p-1">
                <Command.Empty>No models available.</Command.Empty>
                <Command.Group heading="Available Models">
                  {#each availableModels as model (model.id)}
                    <Command.Item
                      value={model.displayName}
                      onSelect={() => selectModel(model.id)}
                      class="flex items-center justify-between text-xs px-2 py-1.5 rounded cursor-pointer"
                    >
                      <div class="flex items-center gap-2 truncate">
                        {#if model.providerIcon}
                          <img
                            src={typeof model.providerIcon === "string"
                              ? model.providerIcon
                              : model.providerIcon.light}
                            alt=""
                            class="size-4 object-contain shrink-0"
                          />
                        {:else}
                          <Brain class="size-4 text-muted-foreground shrink-0" />
                        {/if}
                        <span class="truncate">{model.displayName}</span>
                      </div>
                      {#if model.id === selectedModelId}
                        <Check class="size-3.5 text-primary shrink-0 ml-1" />
                      {/if}
                    </Command.Item>
                  {/each}
                </Command.Group>
              </Command.List>
            </Command.Root>
          </Popover.Content>
        </Popover.Root>

        <!-- Document Context Toggle -->
        <div class="flex items-center gap-1.5">
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  type="button"
                  onclick={() => (includeEntireNote = !includeEntireNote)}
                  class={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer text-xs",
                    includeEntireNote
                      ? "bg-primary/10 text-primary font-medium border border-primary/20"
                      : "hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  <FileText class="size-3" />
                  <span>Entire Note</span>
                </button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="top">
              Include entire note markdown as context for AI
            </Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <span {...props} class="text-muted-foreground/60 cursor-help">
                  <Info class="size-3" />
                </span>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="top" class="max-w-xs text-xs">
              Configured in Settings > AI. Supports Apple Intelligence, Nota Server, and BYOK.
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
      </div>

      <!-- Quick Actions List -->
      {#if isAIActive() && inputValue.trim().length === 0}
        <div
          transition:slide={{ axis: "y", duration: 200 }}
          class="flex max-h-72 flex-col overflow-y-auto p-1.5 border-t border-border/40"
        >
          {#each quickActions as action, idx (action.id)}
            {@render MenuButton(action, idx)}
          {/each}
        </div>
      {/if}
    </div>
  {:else if aiState === AIState.Generating}
    <!-- Generating state — AI is writing into editor -->
    <div transition:fade class="animated-gradient-border rounded p-0.5 shadow-2xl">
      <div class="flex items-center gap-2.5 rounded-md bg-popover/95 p-2 backdrop-blur-md">
        <Sparkle class="size-4 animate-spin text-primary" />
        <span
          class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-semibold text-xs text-transparent"
        >
          AI is writing...
        </span>
        <div class="flex h-4 items-center space-x-1">
          {#each Array(3) as idx,i(i)}
            <div
              data-id={idx}
              class="dot h-1.25 w-1.25 rounded-full bg-primary"
              style:animation-delay="{i * 160}ms"
            ></div>
          {/each}
        </div>
        <Button
          variant="outline"
          size="sm"
          class="h-6 px-2 text-xs ml-2 cursor-pointer"
          onclick={stopGeneration}
        >
          <Square class="size-3 mr-1 fill-current" />
          Stop
        </Button>
      </div>
    </div>
  {:else if aiState === AIState.Confirmation}
    <!-- Action bar — AI finished writing into editor -->
    <div
      transition:fade
      class="flex items-center justify-between gap-1.5 rounded-lg border bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md"
    >
      <Button size="sm" class="h-7 text-xs font-medium cursor-pointer" onclick={replaceSelection}>
        <Check class="size-3.5 mr-1" />
        Replace
      </Button>
      <Button variant="outline" size="sm" class="h-7 text-xs cursor-pointer" onclick={insertNext}>
        <CornerDownLeft class="size-3.5 mr-1" />
        Insert below
      </Button>
      <Button variant="outline" size="sm" class="h-7 text-xs cursor-pointer" onclick={copyToClipboard}>
        <Copy class="size-3.5 mr-1" />
        Copy
      </Button>
      <Button variant="outline" size="sm" class="h-7 text-xs cursor-pointer" onclick={retry}>
        <RotateCcw class="size-3.5 mr-1" />
        Retry
      </Button>
      <Button variant="destructive" size="sm" class="h-7 text-xs cursor-pointer" onclick={discardChanges}>
        <Trash2 class="size-3.5 mr-1" />
        Discard
      </Button>
    </div>
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
  .dot {
    animation: bounce-dots 1.4s ease-in-out infinite;
  }
  @keyframes bounce-dots {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.35;
    }
    50% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }
</style>
