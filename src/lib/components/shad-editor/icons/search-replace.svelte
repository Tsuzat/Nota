<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { type Editor } from '@tiptap/core';
	import { ArrowLeft, ArrowRight, X, Replace, ReplaceAll, CaseSensitive } from 'lucide-svelte';
	import { scale, slide } from 'svelte/transition';

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
	<Popover.Trigger class="absolute top-4 right-4">
		<span class="sr-only">Open Search Menu</span>
	</Popover.Trigger>
	<Popover.Content class="shadow-lg h-fit w-fit flex flex-col gap-2">
		<Popover.Close
			class={buttonVariants({
				variant: 'ghost',
				class: 'size-2 absolute right-2 top-2 p-1 rounded-sm',
				size: 'sm'
			})}
		>
			<X />
		</Popover.Close>
		<div class="flex items-center justify-between gap-1">
			<Input
				placeholder="Enter Text to search.."
				bind:value={searchText}
				oninput={() => updateSearchTerm()}
			/>
			{#if !showReplace}
				<div transition:slide={{ duration: 300 }} class="w-fit">
					{searchCount > 0 ? searchIndex + 1 : 0}/{searchCount}
				</div>
			{/if}
			<Button variant="ghost" class="size-8" onclick={previous} title="Previous">
				<ArrowLeft />
			</Button>
			<Button variant="ghost" class="size-8" onclick={next} title="Next">
				<ArrowRight />
			</Button>
			{#if !showReplace}
				<div transition:slide={{ duration: 300 }} class="flex items-center gap-1">
					<Button
						variant="ghost"
						class={cn('size-8', caseSensitive && 'bg-muted')}
						onclick={() => {
							caseSensitive = !caseSensitive;
							updateSearchTerm();
						}}
						title={caseSensitive ? 'Disable Case Sensitive' : 'Enable Case Sensitive'}
					>
						<CaseSensitive />
					</Button>
					<Button
						variant="ghost"
						class={cn('size-8', showReplace && 'bg-muted')}
						onclick={() => (showReplace = !showReplace)}
						title={showReplace ? 'Close Replace Menu' : 'Open Replace Menu'}
					>
						<Replace />
					</Button>
				</div>
			{/if}
		</div>
		{#if showReplace}
			<div transition:slide={{ duration: 300 }} class="flex items-center justify-between">
				<Input
					placeholder="Enter Text to Replace.."
					bind:value={replaceText}
					oninput={() => updateSearchTerm()}
					class="mr-1 "
				/>
				<Button variant="ghost" class="ml-1 size-8" onclick={replace} title="Replace">
					<Replace />
				</Button>
				<Button variant="ghost" class="ml-1 size-8" onclick={replaceAll} title="Replace All">
					<ReplaceAll />
				</Button>
			</div>
			<div transition:slide={{ duration: 300 }} class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<input type="checkbox" bind:checked={caseSensitive} onchange={() => updateSearchTerm()} />
					<span>Case Sensitive</span>
				</div>
				<div class="flex items-center gap-2">
					{searchCount > 0 ? searchIndex + 1 : 0} / {searchCount}
				</div>
			</div>
			<div transition:slide={{ duration: 300 }} class="flex items-center gap-2">
				<input type="checkbox" bind:checked={showReplace} />
				<p>Open Replace Menu</p>
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
