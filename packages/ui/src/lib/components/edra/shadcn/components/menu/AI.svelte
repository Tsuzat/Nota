<script lang="ts">
import {
	ArrowDownWideNarrow,
	Brain,
	Check,
	CheckCheck,
	ChevronsUpDown,
	Copy,
	CornerDownLeft,
	Feather,
	FileText,
	Info,
	PenLine,
	RefreshCcwDot,
	RotateCcw,
	Send,
	Sparkle,
	Sparkles,
	TextWrap,
	Trash2,
} from "@lucide/svelte";
import { fade, slide } from "svelte/transition";
import { toast } from "svelte-sonner";
import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
import * as Command from "#lib/components/ui/command/index.js";
import * as Popover from "#lib/components/ui/popover/index.js";
import * as Tooltip from "#lib/components/ui/tooltip/index.js";
import { cn } from "#lib/utils.js";
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
} from "../../../commands/index.js";
import {
	BubbleMenu,
	getEditor,
	removeAIHighlight,
	useEditorTransaction,
} from "../../../tiptap/index.js";

export interface AIModel {
	id: string;
	displayName: string;
	provider?: string;
	providerIcon?: string | { dark: string; light: string };
	notes?: string;
	[key: string]: unknown;
}

interface Props {
	availableModels?: AIModel[];
}

let { availableModels: propAvailableModels = [] }: Props = $props();

let inputTag = $state<HTMLTextAreaElement | null>(null);
const editor = getEditor();

let inputValue = $state("");
let aiState = $state(AIState.Idle);
let aiResponse = $state("");
let activeOptionIndex = $state(0);
let generating = $state(false);

// Model selector & note context state
let selectedModelId = $state(
	(typeof localStorage !== "undefined" &&
		localStorage.getItem("ai_provider")) ||
		"gpt-5.6-luna",
);
let includeEntireNote = $state(false);
let modelSelectorOpen = $state(false);

// Position tracking for inline editor streaming
let originalFrom = $state(0);
let aiContentFrom = $state(0);
let aiContentTo = $state(0);
let lastPrompt = $state("");
let updateTimer: ReturnType<typeof setTimeout> | null = null;

const activeCallAI = $derived(
	editor.extensionManager.extensions.find((e) => e.name === "ai-highlight")
		?.options?.callAI,
);

const extensionAvailableModels = $derived(
	editor.extensionManager.extensions.find((e) => e.name === "ai-highlight")
		?.options?.availableModels ?? [],
);

const availableModels = $derived<AIModel[]>(
	propAvailableModels.length > 0
		? propAvailableModels
		: extensionAvailableModels,
);

const displayModels = $derived<AIModel[]>(
	availableModels.length > 0
		? availableModels
		: [
				{
					id: "gpt-5.6-luna",
					displayName: "GPT-5.6 Luna",
					provider: "openai",
					notes: "Cost-optimized GPT-5.6 model for high-volume workloads.",
				},
				{
					id: "gpt-5.6",
					displayName: "GPT-5.6",
					provider: "openai",
					notes: "OpenAI's flagship frontier model.",
				},
				{
					id: "claude-sonnet-5",
					displayName: "Claude Sonnet 5",
					provider: "anthropic",
					notes: "Fast and intelligent reasoning model.",
				},
				{
					id: "gemini-3.7-flash",
					displayName: "Gemini 3.7 Flash",
					provider: "google",
					notes: "Latest GA Gemini Flash model for agentic workflows.",
				},
			],
);

const selectedModel = $derived(
	displayModels.find((m) => m.id === selectedModelId) ?? {
		id: selectedModelId,
		displayName: selectedModelId,
		provider: "openai",
	},
);

function selectModel(id: string) {
	selectedModelId = id;
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

const transaction = useEditorTransaction(editor);

function isAIActive() {
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
	const id = Symbol("AI_THINKING_TOAST").toString();
	const selectedText = getAIHighlightedText();
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

		if (includeEntireNote) {
			const fullNote = getFullNoteMarkdown();
			if (fullNote) {
				prompt = `[DOCUMENT_CONTEXT]:\n${fullNote}\n\n${prompt}`;
			}
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
	const text = getAIHighlightedText() || "";
	try {
		const fullNote = includeEntireNote ? getFullNoteMarkdown() : "";
		let prompt = "";
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
		aiState = AIState.Confirmation;
		await generateAIContent(prompt);
	} catch (error) {
		aiState = AIState.Idle;
		console.error(error);
		toast.error("Something went wrong! Check console.");
	}
}

async function generateAIContent(prompt: string, isRetry = false) {
	void transaction.version;
	generating = true;
	lastPrompt = prompt;
	aiResponse = "";

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
			aiResponse += chunk;
			scheduleEditorUpdate();
		};
		const onError = (error: Error) => {
			toast.error("Something went wrong when calling AI.", {
				description: error.message,
			});
			console.error(error);
			cleanupAIContent();
			aiState = AIState.Idle;
			aiResponse = "";
			generating = false;
		};

		if (activeCallAI) {
			await activeCallAI(prompt, onChunk, onError);
		}
		// Final flush to ensure all content is rendered in the editor
		flushEditorUpdate();
	} finally {
		generating = false;
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
			// Replace existing AI content with the updated (longer) response
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
		// The content AFTER the AI region is unchanged, so:
		// newAiContentTo = newDocSize - (oldDocSize - oldAiContentTo)
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

/** Remove AI-generated content from the editor (without adding to undo history) */
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
	if (generating) {
		// If still generating, just mark for cleanup
		generating = false;
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
	{
		id: "continue",
		label: "Continue writing",
		icon: PenLine,
		handler: () => processText("continue"),
	},
	{
		id: "solve",
		label: "Solve problem",
		icon: Brain,
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
	if (!isAIActive() && aiState !== AIState.Confirmation) return;

	if (event.key === "Escape") {
		event.preventDefault();
		if (modelSelectorOpen) {
			modelSelectorOpen = false;
			return;
		}
		closeAI();
		return;
	}

	if (aiState === AIState.Idle) {
		// If model selector popup is open, let Command handle navigation
		if (modelSelectorOpen) return;

		const showQuickActions = isAIActive() && inputValue.trim()?.length === 0;
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
				quickActions[activeOptionIndex].handler();
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
		class="group/dropdown-menu-item relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden transition-colors select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive {activeOptionIndex ===
		idx
			? 'quick-action-active bg-accent text-accent-foreground'
			: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
	>
		<Icon />
		<span class="ml-2 flex-1 text-start font-medium">{action.label}</span>
		{#if activeOptionIndex === idx}
			<span class="rounded-sm bg-muted/75 px-1 text-muted-foreground">Enter</span>
		{/if}
	</button>
{/snippet}

<BubbleMenu
	{editor}
	pluginKey="ai-bubble-menu"
	shouldShow={(props) => {
		const { editor: propsEditor, view } = props;
		if (!propsEditor || !propsEditor.isEditable || propsEditor.isDestroyed) return false;
		if (!view || propsEditor.view.dragging) return false;

		// Always show during AI confirmation (streaming or action bar)
		if (aiState === AIState.Confirmation) return true;

		if (propsEditor.isActive('ai-highlight')) return true;

		removeAIHighlight(propsEditor);
		aiState = AIState.Idle;
		aiResponse = '';
		return false;
	}}
	class="absolute z-100 flex max-h-120 max-w-3xl flex-col rounded-lg bg-popover/75 p-0 backdrop-blur-2xl transition-[height] duration-500"
	options={{
		strategy: 'absolute',
		autoPlacement: {
			allowedPlacements: ['bottom-start', 'top-start']
		},
		scrollTarget: editor.view.dom.parentElement ?? window,
		onShow() {
			activeOptionIndex = 0;
			inputTag?.focus({ preventScroll: true });
		},
		onHide() {
			inputTag?.blur();
			modelSelectorOpen = false;
		}
	}}
>
	{#if aiState === AIState.Idle}
		<div class="flex w-xl flex-col overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl">
			<!-- Input Area -->
			<form class="flex items-start px-3 py-3" onsubmit={handleSubmit}>
				<textarea
					bind:value={inputValue}
					bind:this={inputTag}
					oninput={handleInput}
					rows={1}
					placeholder="Ask AI anything..."
					class="h-auto max-h-40 w-full resize-none border-0 outline-hidden"></textarea>
				<Button type="submit" size="icon-lg" class="rounded-full"><Send /></Button>
			</form>

			<!-- Toolbar: Model selector on left, Include Entire Note on right -->
			<div class="flex items-center justify-between border-t border-border/50 bg-muted/20 px-2 py-1.5">
				<!-- Model Selector (Combobox) -->
				<Popover.Root bind:open={modelSelectorOpen}>
					<Popover.Trigger
						class={buttonVariants({
							variant: 'ghost',
							size: 'sm',
							class: 'h-7 gap-1.5 px-2 text-xs font-normal text-muted-foreground hover:text-foreground'
						})}
					>
						{#if selectedModel}
							{#if typeof selectedModel.providerIcon === 'object' && selectedModel.providerIcon !== null}
								<img src={selectedModel.providerIcon.dark} alt="" class="size-3.5 shrink-0 rounded-xs hidden dark:block" />
								<img src={selectedModel.providerIcon.light} alt="" class="size-3.5 shrink-0 rounded-xs block dark:hidden" />
							{:else if typeof selectedModel.providerIcon === 'string'}
								<img src={selectedModel.providerIcon} alt="" class="size-3.5 shrink-0 rounded-xs" />
							{:else}
								<Sparkles class="size-3.5 shrink-0 text-muted-foreground" />
							{/if}
							<span class="max-w-36 truncate font-medium">{selectedModel.displayName}</span>
						{:else}
							<Sparkles class="size-3.5 shrink-0 text-muted-foreground" />
							<span class="max-w-36 truncate font-medium">{selectedModelId}</span>
						{/if}
						<ChevronsUpDown class="size-3 shrink-0 opacity-50" />
					</Popover.Trigger>
					<Popover.Content
						align="start"
						side="bottom"
						sideOffset={4}
						class="z-110 max-h-80 w-72 p-0! text-primary! shadow-2xl bg-popover/95 backdrop-blur-2xl border border-border"
						onCloseAutoFocus={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						onEscapeKeydown={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<Command.Root class="p-0!">
							<Command.Input placeholder="Search models..." />
							<Command.List class="max-h-60 overflow-y-auto p-1">
								<Command.Empty class="py-4 text-center text-xs text-muted-foreground">No models available.</Command.Empty>
								<Command.Group value="models">
									<Tooltip.Provider delayDuration={150}>
										{#each displayModels as model (model.id)}
											<Command.Item
												value={`${model.displayName} ${model.id} ${model.provider ?? ''} ${model.notes ?? ''}`}
												onSelect={() => selectModel(model.id)}
												onclick={() => selectModel(model.id)}
												class="group/model-item flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs"
											>
												<div class="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
													<Check class={cn('size-3.5 shrink-0', model.id !== selectedModelId && 'invisible')} />
													{#if typeof model.providerIcon === 'object' && model.providerIcon !== null}
														<img src={model.providerIcon.dark} alt="" class="size-3.5 shrink-0 rounded-xs hidden dark:block" />
														<img src={model.providerIcon.light} alt="" class="size-3.5 shrink-0 rounded-xs block dark:hidden" />
													{:else if typeof model.providerIcon === 'string'}
														<img src={model.providerIcon} alt="" class="size-3.5 shrink-0 rounded-xs" />
													{:else}
														<Sparkles class="size-3.5 shrink-0 text-muted-foreground" />
													{/if}
													<span class="font-medium text-foreground truncate">{model.displayName}</span>
												</div>

												{#if model.notes}
													<Tooltip.Root>
														<Tooltip.Trigger
															onclick={(e: MouseEvent) => e.stopPropagation()}
															class="text-muted-foreground ml-auto! hover:text-foreground shrink-0 rounded p-0.5 transition-colors focus:outline-hidden"
														>
															<Info class="size-3.5" />
														</Tooltip.Trigger>
														<Tooltip.Content side="right" sideOffset={8} class="max-w-xs z-150 text-xs shadow-lg leading-relaxed">
															<span>{model.notes}</span>
														</Tooltip.Content>
													</Tooltip.Root>
												{/if}
											</Command.Item>
										{/each}
									</Tooltip.Provider>
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>

				<!-- Include Entire Note -->
				<Button
					type="button"
					variant={includeEntireNote ? 'default' : 'ghost'}
					size="sm"
					class="h-7 gap-1.5 px-2 text-xs transition-colors"
					onclick={() => {
						includeEntireNote = !includeEntireNote;
					}}
				>
					<FileText class="size-3.5" />
					<span>Include Entire Note</span>
				</Button>
			</div>

			{#if isAIActive() && inputValue.trim()?.length === 0}
				<!-- Quick Actions List -->
				<div
					transition:slide={{ axis: 'y', duration: 250 }}
					class="flex max-h-72 flex-col overflow-y-auto p-1.5 border-t border-border/50"
				>
					{#each quickActions as action, idx (action.id)}
						{@render MenuButton(action, idx)}
					{/each}
				</div>
			{/if}
		</div>
	{:else if aiState === AIState.Confirmation}
		{#if generating}
			<!-- AI is writing — content streams directly into editor -->
			<div transition:fade class="animated-gradient-border rounded p-0.5">
				<div class="flex items-center gap-2 rounded-md bg-popover p-1">
					<Sparkle class="size-4!" />
					<span
						class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-semibold text-transparent"
					>
						AI is writing</span
					>
					<div class="flex h-5 items-center space-x-0.5">
						{#each Array(3) as id, i (i)}
							<div
								data-ball-number={id}
								class="dot h-1.25 w-1.25 rounded-full bg-primary"
								style:animation-delay="{i * 160}ms"
							></div>
						{/each}
						<span class="sr-only">Loading</span>
					</div>
				</div>
			</div>
		{:else}
			<!-- Action bar — AI has finished streaming into editor -->
			<div
				transition:fade
				class="flex items-center justify-between gap-2 rounded-lg border p-2 shadow-2xl"
			>
				<Button size="sm" onclick={replaceSelection}>
					<Check />
					Replace
				</Button>
				<Button variant="outline" size="sm" onclick={insertNext}>
					<CornerDownLeft />
					Insert
				</Button>
				<Button variant="outline" size="sm" onclick={copyToClipboard}>
					<Copy />
					Copy
				</Button>
				<Button variant="outline" size="sm" onclick={retry}>
					<RotateCcw />
					Retry
				</Button>
				<Button variant="destructive" size="sm" onclick={discardChanges}>
					<Trash2 />
					Discard
				</Button>
			</div>
		{/if}
	{/if}
</BubbleMenu>

<style>
	@property --angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}
	@keyframes rotate {
		to {
			--angle: 360deg;
		}
	}
	.animated-gradient-border {
		background: conic-gradient(from var(--angle), #e50909, #c8b207, #e608e6, #6eec07);
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
