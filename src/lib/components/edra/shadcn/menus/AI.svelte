<script lang="ts">
	import { type Editor } from '@tiptap/core';
	import type { ShouldShowProps } from '../../types';
	import BubbleMenu from '../../components/BubbleMenu.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDownWideNarrow from '@lucide/svelte/icons/arrow-down-wide-narrow';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import RefreshCcwDot from '@lucide/svelte/icons/refresh-ccw-dot';
	import TextWrap from '@lucide/svelte/icons/text-wrap';
	import CheckCheck from '@lucide/svelte/icons/check-check';
	import Sparkle from '@lucide/svelte/icons/sparkle';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import X from '@lucide/svelte/icons/x';
	import { toast } from 'svelte-sonner';
	import { removeAIHighlight } from '../../extensions/AIHighLight';
	import { Separator } from '$lib/components/ui/separator';

	import {
		CONTINUE_WRITING,
		FIX_GRAMMER_PROMPT,
		MAKE_LONGER_PROMPT,
		MAKE_SHORTED_PROMPT,
		SUMMARIZE_PROMPT
	} from '$lib/supabase/ai/prompt';
	import { callGeminiAI } from '$lib/gemini';
	import { fade } from 'svelte/transition';
	import RenderMarkdown from '$lib/components/custom/render-markdown.svelte';

	interface Props {
		editor: Editor;
		parentElement?: HTMLElement;
	}
	const { editor, parentElement }: Props = $props();

	function shouldShow(props: ShouldShowProps) {
		if (!props.editor.isEditable || props.editor.isDestroyed) return false;
		const { view, editor } = props;
		if (!view || editor.view.dragging) {
			return false;
		}
		if (editor.isActive('ai-highlight') && !editor.state.selection.empty) {
			return true;
		} else {
			removeAIHighlight(editor);
			aiState = AIState.Idle;
			aiResponse = '';
			return false;
		}
	}

	enum AIState {
		Idle = 'Idle',
		Thinking = 'Thinking',
		Confirmation = 'Confirmation'
	}

	let inputValue = $state('');
	let aiState = $state(AIState.Idle);
	let aiResponse = $state('');

	function getSelectionText(): string | undefined {
		const { from, to } = editor.view.state.selection;
		const slice = editor.view.state.doc.cut(from, to);
		if (editor.markdown) return editor.markdown.serialize(slice.toJSON());
	}

	async function processText(type: 'shorter' | 'longer' | 'summarize' | 'grammer' | 'continue') {
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
					prompt = MAKE_SHORTED_PROMPT(selectedText);
					break;
				case 'longer':
					prompt = MAKE_LONGER_PROMPT(selectedText);
					break;
				case 'summarize':
					prompt = SUMMARIZE_PROMPT(selectedText);
					break;
				case 'grammer':
					prompt = FIX_GRAMMER_PROMPT(selectedText);
					break;
				case 'continue':
					prompt = CONTINUE_WRITING(selectedText);
					break;
			}
			aiState = AIState.Confirmation;
			await callGeminiAI(
				prompt,
				(chunk) => {
					aiResponse += chunk;
				},
				(error) => {
					toast.error('Something went wrong when calling AI.', {
						description: error.message
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

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!inputValue) return;
		const text = getSelectionText();
		if (!text) return;
		try {
			aiState = AIState.Confirmation;
			const prompt = `${text}\n\n\n${inputValue}`;

			await callGeminiAI(
				prompt,
				(chunk) => {
					aiResponse += chunk;
				},
				(error) => {
					toast.error('Something went wrong when calling AI.', {
						description: error.message
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
		editor
			.chain()
			.focus()
			.insertContentAt({ from, to }, aiResponse, { contentType: 'markdown' })
			.run();
	}

	function insertNext() {
		const { to } = editor.view.state.selection;
		editor
			.chain()
			.focus()
			.insertContentAt(to + 1, aiResponse, { contentType: 'markdown' })
			.run();
	}

	function discardChanges() {
		aiResponse = '';
		aiState = AIState.Idle;
	}
</script>

<BubbleMenu
	{editor}
	pluginKey="edra-bubble-menu"
	{shouldShow}
	class="bg-popover flex max-h-120 max-w-3xl flex-col rounded-lg border p-0 transition-[height] duration-500"
	options={{
		shift: {
			crossAxis: true
		},
		strategy: 'absolute',
		autoPlacement: {
			allowedPlacements: ['bottom', 'top']
		},
		scrollTarget: parentElement
	}}
>
	{#if aiState === AIState.Idle}
		<form onsubmit={handleSubmit} class="flex items-center justify-between gap-2 p-2">
			<Input
				bind:value={inputValue}
				placeholder="Ask AI anything..."
				type="text"
				class="border-0 bg-transparent! ring-0!"
			/>
			<Button type="submit" size="icon-sm" class="rounded-full">
				<ArrowUp />
			</Button>
		</form>
		<div class="flex flex-col gap-1 overflow-auto">
			<Separator orientation="horizontal" />
			<small class="text-muted-foreground ml-4 p-1 text-start">Quick Actions</small>
			<button
				title=""
				onclick={makeTextShorter}
				class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
			>
				<ArrowDownWideNarrow />
				<span>Make Shorter</span>
			</button>
			<button
				onclick={makeTextLonger}
				class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
			>
				<TextWrap />
				<span>Make Longer</span>
			</button>
			<button
				title=""
				onclick={summarizeText}
				class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
			>
				<RefreshCcwDot />
				<span>Summarize</span>
			</button>
			<button
				title=""
				onclick={continueWriting}
				class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
			>
				<PenLine />
				<span>Continue Writing</span>
			</button>
			<button
				title=""
				onclick={checkGrammer}
				class="hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
			>
				<CheckCheck />
				<span>Fix Grammer</span>
			</button>
		</div>
	{:else if aiState === AIState.Confirmation}
		{#if aiResponse === ''}
			<div transition:fade class="animated-gradient-border rounded-lg p-0.25">
				<div class="bg-popover inline-flex items-center gap-2 rounded p-2">
					<Sparkle class="size-4!" />
					<span
						class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-bold text-transparent"
					>
						AI is thinking</span
					>
					<div class="flex h-5 items-center space-x-1">
						{#each Array(3) as _, i}
							<div
								class="bg-primary h-2 w-2 animate-[bounce-dots_1.4s_ease-in-out_infinite] rounded-full"
								style:animation-delay="{i * 160}ms"
							></div>
						{/each}
						<span class="sr-only">Loading</span>
					</div>
				</div>
			</div>
		{:else}
			<div transition:fade class="flex items-center justify-between gap-2 px-2 py-1">
				<small>Actions:</small>
				<Button variant="secondary" size="sm" onclick={replaceSelection}>
					<CheckCheck />
					Replace Selection
				</Button>
				<Button size="sm" onclick={insertNext}>
					<ArrowDown />
					Insert Next
				</Button>
				<Button variant="destructive" size="sm" onclick={discardChanges}>
					<X />
					Discard Changes
				</Button>
			</div>
			<Separator />
			<RenderMarkdown
				data={aiResponse}
				class="w-full max-w-xl flex-1 grow overflow-auto px-4 py-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
			/>
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
		background: conic-gradient(from var(--angle), #9229f3, #004cff, #00a930, #f7a312, #ff0a0a);
		animation: rotate 2s linear infinite;
		border-radius: 4px !important;
	}
</style>
