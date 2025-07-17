<script lang="ts">
	import { NodeViewWrapper, NodeViewContent } from 'svelte-tiptap';
	import type { NodeViewProps } from '@tiptap/core';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	const { editor, node, updateAttributes, extension }: NodeViewProps = $props();
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';

	let preRef = $state<HTMLPreElement>();

	let isCopying = $state(false);

	const languages: string[] = extension.options.lowlight.listLanguages().sort();

	let defaultLanguage = $state(node.attrs.language);

	function copyCode() {
		if (!preRef) return;
		isCopying = true;
		navigator.clipboard.writeText(preRef.innerText);
		setTimeout(() => {
			isCopying = false;
		}, 1000);
	}
</script>

<NodeViewWrapper class="code-wrapper" draggable={false} spellcheck={false}>
	<div class="code-wrapper-tile" contenteditable="false">
		<Popover.Root>
			<Popover.Trigger
				contenteditable="false"
				disabled={!editor.isEditable}
				class={buttonVariants({
					variant: 'ghost',
					size: 'sm',
					class: 'text-muted-foreground h-6 px-1 py-2 text-xs'
				})}
			>
				<span class="capitalize">
					{defaultLanguage}
				</span>
				<ChevronDown class="!size-2" />
			</Popover.Trigger>
			<Popover.Content class="h-96 w-40 p-0 transition-all duration-500" contenteditable="false">
				<Command.Root>
					<Command.Input placeholder="Search..." />
					<Command.List class="!max-h-full">
						<Command.Empty>No language found.</Command.Empty>
						{#each languages as language (language)}
							<Command.Item
								contenteditable="false"
								data-current={defaultLanguage === language}
								class="data-[current=true]:bg-muted"
								onclick={() => {
									defaultLanguage = language;
									updateAttributes({ language: defaultLanguage });
								}}
							>
								<span>{language}</span>
								{#if defaultLanguage === language}
									<Check class="ml-auto" />
								{/if}
							</Command.Item>
						{/each}
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<Button variant="ghost" class="!size-6 p-0" onclick={copyCode}>
			{#if isCopying}
				<Check class="size-3 text-green-500" />
			{:else}
				<Copy class="size-3" />
			{/if}
		</Button>
	</div>
	<pre bind:this={preRef} draggable={false}>
		<NodeViewContent as="code" class={`language-${defaultLanguage}`} {...node.attrs} />
	</pre>
</NodeViewWrapper>
