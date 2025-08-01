<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Editor } from '@tiptap/core';
	import Search from '@lucide/svelte/icons/search';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
	import Replace from '@lucide/svelte/icons/replace';
	import ReplaceAll from '@lucide/svelte/icons/replace-all';
	import { cn, getKeyboardShortcut } from '$lib/utils.js';
	import { slide } from 'svelte/transition';
	import EdraToolTip from '../EdraToolTip.svelte';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	let open = $state(false);
	let showMore = $state(false);

	let searchText = $state('');
	let replaceText = $state('');
	let caseSensitive = $state(false);

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
		const position = results[resultIndex];
		if (!position) return;
		editor.commands.setTextSelection(position);
		const { node } = editor.view.domAtPos(editor.state.selection.anchor);
		if (node instanceof HTMLElement) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
		caseSensitive = false;
		editor.commands.resetIndex();
	};

	const replaceAll = () => editor.commands.replaceAll();

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			e.preventDefault();
			open = false;
		} else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
			e.preventDefault();
			open = true;
		}
	}
</script>

<svelte:document onkeydown={handleKeyDown} />

<Popover.Root
	bind:open
	onOpenChange={(value) => {
		if (value === false) {
			clear();
			updateSearchTerm();
		}
	}}
>
	<Popover.Trigger>
		<EdraToolTip tooltip="Search and Replace" shortCut={getKeyboardShortcut('F', true)}>
			<Button variant="ghost" size="icon" class="size-7">
				<Search />
			</Button>
		</EdraToolTip>
	</Popover.Trigger>
	<Popover.Content
		class="flex w-fit items-center gap-1 p-2"
		portalProps={{ disabled: true, to: undefined }}
	>
		<Button
			variant="ghost"
			size="icon"
			class={cn('size-7 transition-transform', showMore && 'bg-muted rotate-90')}
			onclick={() => (showMore = !showMore)}
			title="Show More"
		>
			<ChevronRight />
		</Button>
		<div class="flex size-full flex-col gap-1">
			<div class="flex w-full items-center gap-1">
				<Input
					placeholder="Search..."
					bind:value={searchText}
					oninput={() => updateSearchTerm()}
					class="w-48"
				/>
				<span class="text-muted-foreground text-sm"
					>{searchCount > 0 ? searchIndex + 1 : 0}/{searchCount}
				</span>
				<EdraToolTip tooltip="Case Sensitive">
					<Button
						variant="ghost"
						size="icon"
						class={cn('size-7', caseSensitive && 'bg-muted')}
						onclick={() => {
							caseSensitive = !caseSensitive;
							updateSearchTerm();
						}}
					>
						<CaseSensitive />
					</Button>
				</EdraToolTip>
				<EdraToolTip tooltip="Go to previous">
					<Button variant="ghost" size="icon" class="size-7" onclick={previous} title="Previous">
						<ArrowLeft />
					</Button>
				</EdraToolTip>
				<EdraToolTip tooltip="Go to next">
					<Button variant="ghost" size="icon" class="size-7" onclick={next} title="Next">
						<ArrowRight />
					</Button>
				</EdraToolTip>
			</div>
			{#if showMore}
				<div transition:slide class="flex w-full items-center gap-1">
					<Input
						placeholder="Replace..."
						bind:value={replaceText}
						oninput={() => updateSearchTerm()}
						class="w-48"
					/>
					<EdraToolTip tooltip="Replace">
						<Button variant="ghost" size="icon" class="size-7" onclick={replace}>
							<Replace />
						</Button>
					</EdraToolTip>
					<EdraToolTip tooltip="Replace All">
						<Button variant="ghost" size="icon" class="size-7" onclick={replaceAll}>
							<ReplaceAll />
						</Button>
					</EdraToolTip>
				</div>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
