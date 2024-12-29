<script lang="ts">
	import Tooltip from '$lib/components/customs/tooltip.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { type Editor } from '@tiptap/core';
	import { ArrowLeft, ArrowRight, X, Replace, ReplaceAll } from 'lucide-svelte';

	let { editor, open = $bindable(false) }: { editor: Editor; open: boolean } = $props();

	let searchText = $state('');
	let replaceText = $state('');
	let caseSensitive = $state(false);
	let showReplace = $state(false);

	let searchIndex = $derived(editor.storage?.searchAndReplace?.resultIndex);
	let searchCount = $derived(editor.storage?.searchAndReplace?.results.length);

	function updateSearchTerm(clearIndex: boolean = false) {
		if (clearIndex) editor.commands.resetIndex();

		editor.commands.setSearchTerm(searchText);
		editor.commands.setReplaceTerm(replaceText);
		editor.commands.setCaseSensitive(caseSensitive);
	}

	function goToSelection() {
		const { results, resultIndex } = editor.storage.searchAndReplace;
		const position: Range = results[resultIndex];
		if (!position) return;
		//@ts-ignore
		editor.commands.setTextSelection(position);
		const { node } = editor.view.domAtPos(editor.state.selection.anchor);
		node instanceof HTMLElement && node.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function replace() {
		editor.commands.replace();
		goToSelection();
	}

	const next = () => {
		editor.commands.nextSearchResult();
		goToSelection();
	};

	const previous = () => {
		editor.commands.previousSearchResult();
		goToSelection();
	};

	const clear = () => {
		searchText = '';
		replaceText = '';
		editor.commands.resetIndex();
	};

	const replaceAll = () => editor.commands.replaceAll();
</script>

<Popover.Root
	bind:open
	onOpenChange={(open) => {
		if (open) updateSearchTerm();
		else {
			clear();
			updateSearchTerm(true);
		}
	}}
>
	<Popover.Trigger class="fixed top-4 right-4"></Popover.Trigger>
	<Popover.Content class="bg-popover shadow-lg *:my-2">
		<div class="flex items-center justify-between">
			<Input
				placeholder="Enter Text to search.."
				bind:value={searchText}
				oninput={() => updateSearchTerm()}
				class="mr-1 "
			/>
			<Tooltip text="Previous">
				<Button variant="ghost" class="ml-1 size-8" onclick={previous}>
					<ArrowLeft />
				</Button>
			</Tooltip>
			<Tooltip text="Next">
				<Button variant="ghost" class="ml-1 size-8" onclick={next}>
					<ArrowRight />
				</Button>
			</Tooltip>
		</div>
		{#if showReplace}
			<div class="flex items-center justify-between">
				<Input
					placeholder="Enter Text to Replace.."
					bind:value={replaceText}
					oninput={() => updateSearchTerm()}
					class="mr-1 "
				/>
				<Tooltip text="Replace">
					<Button variant="ghost" class="ml-1 size-8" onclick={replace}>
						<Replace />
					</Button>
				</Tooltip>
				<Tooltip text="Replace All">
					<Button variant="ghost" class="ml-1 size-8" onclick={replaceAll}>
						<ReplaceAll />
					</Button>
				</Tooltip>
			</div>
		{/if}
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					class="checkbox"
					bind:checked={caseSensitive}
					onchange={() => updateSearchTerm()}
				/>
				<p>Case Sensitive</p>
			</div>
			<div class="flex items-center gap-2">
				{searchCount > 0 ? searchIndex + 1 : 0} / {searchCount}
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
