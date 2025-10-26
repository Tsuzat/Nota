<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
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
		MAKE_LONGER_PROMPT,
		MAKE_SHORTED_PROMPT,
		SUMMARIZE_PROMPT
	} from '$lib/supabase/ai/prompt';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();
	const session = $derived(getSessionAndUserContext().getSession());

	function getSelectionText(): string {
		const slice = editor.state.selection.content();
		return editor.storage.markdown.serializer.serialize(slice.content);
	}

	function insertMD(text: string) {
		const { from, to } = editor.view.state.selection;
		editor.chain().focus().insertContentAt({ from, to }, text).run();
	}

	async function processText(type: 'shorter' | 'longer' | 'summarize') {
		const id = toast.loading('AI is thinking...', { duration: 10000 });
		try {
			let prompt = '';
			switch (type) {
				case 'shorter':
					prompt = MAKE_SHORTED_PROMPT(getSelectionText());
					break;
				case 'longer':
					prompt = MAKE_LONGER_PROMPT(getSelectionText());
					break;
				case 'summarize':
					prompt = SUMMARIZE_PROMPT(getSelectionText());
					break;
			}
			const token = session?.access_token;
			if (!token) {
				toast.error('Please login to use AI features.');
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

	function checkGrammer(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		throw new Error('Function not implemented.');
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<EdraToolTip tooltip="AI Assistant">
			<Button variant="ghost" class="h-8 w-fit gap-0.5 p-2">
				<span
					class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-bold text-transparent"
					>Ask AI</span
				>
				<ChevronDown class="text-muted-foreground !size-2" />
			</Button>
		</EdraToolTip>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="" portalProps={{ disabled: true, to: undefined }}>
		<DropdownMenu.Item onclick={makeTextShorter}>
			<ArrowDownWideNarrow />
			<span>Make Shorter</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={makeTextLonger}>
			<TextWrap />
			<span>Make Longer</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={summarizeText}>
			<RefreshCcwDot />
			<span>Summarize</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={checkGrammer}>
			<CheckCheck />
			<span>Fix Grammer</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
