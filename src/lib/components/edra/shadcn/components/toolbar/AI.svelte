<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ArrowDownWideNarrow from '@lucide/svelte/icons/arrow-down-wide-narrow';
	import TextWrap from '@lucide/svelte/icons/text-wrap';
	import RefreshCcwDot from '@lucide/svelte/icons/refresh-ccw-dot';
	import CheckCheck from '@lucide/svelte/icons/check-check';
	import EdraToolTip from '../EdraToolTip.svelte';
	import { toast } from 'svelte-sonner';
	import type { Editor } from '@tiptap/core';
	import { callAI } from '$lib/supabase/ai';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import {
		FIX_GRAMMER_PROMPT,
		MAKE_LONGER_PROMPT,
		MAKE_SHORTED_PROMPT,
		SUMMARIZE_PROMPT
	} from '$lib/supabase/ai/prompt';
	import { buttonVariants } from '$lib/components/ui/button';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();
	const session = $derived(getSessionAndUserContext().getSession());

	function getSelectionText(): string | undefined {
		const slice = editor.state.selection.content();
		if (editor.markdown) return editor.markdown?.serialize(slice.toJSON());
	}

	function insertMD(text: string) {
		const { from, to } = editor.view.state.selection;
		editor.chain().focus().insertContentAt({ from, to }, text, { contentType: 'markdown' }).run();
	}

	async function processText(type: 'shorter' | 'longer' | 'summarize' | 'grammer') {
		const id = toast.loading('AI is thinking...', { duration: 10000 });
		const selectedText = getSelectionText();
		if (selectedText === undefined) {
			toast.error('Can not get the selected content from editor');
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
			}
			const token = session?.access_token;
			if (!token) {
				toast.error('Please login to use AI features.', { id });
				return;
			}
			const data = await callAI(prompt, token);
			insertMD(data);
			toast.success('AI Changes are done!', { id });
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong! Check console.', { id });
		}
	}

	const makeTextShorter = () => processText('shorter');

	const makeTextLonger = () => processText('longer');

	const summarizeText = () => processText('summarize');

	const checkGrammer = () => processText('grammer');
</script>

<Select.Root type="single">
	<EdraToolTip tooltip="AI Assistant">
		<Select.Trigger class={buttonVariants({ variant: 'ghost', class: 'h-8 w-fit gap-0.5 p-2' })}>
			<span
				class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-bold text-transparent"
			>
				Ask AI</span
			>
			<ChevronDown class="text-muted-foreground size-2!" />
		</Select.Trigger>
	</EdraToolTip>
	<Select.Content class="w-fit">
		<Select.Item value="shorter" onclick={makeTextShorter}>
			<ArrowDownWideNarrow />
			<span>Make Shorter</span>
		</Select.Item>
		<Select.Item value="longer" onclick={makeTextLonger}>
			<TextWrap />
			<span>Make Longer</span>
		</Select.Item>
		<Select.Item value="summarize" onclick={summarizeText}>
			<RefreshCcwDot />
			<span>Summarize</span>
		</Select.Item>
		<Select.Item value="grammer" onclick={checkGrammer}>
			<CheckCheck />
			<span>Fix Grammer</span>
		</Select.Item>
	</Select.Content>
</Select.Root>
