<script lang="ts">
	import { NodeViewWrapper, NodeViewContent } from 'svelte-tiptap';
	import type { NodeViewProps } from '@tiptap/core';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	const { node, editor, selected, deleteNode, updateAttributes, extension }: NodeViewProps =
		$props();
	import { Copy, Check } from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';

	let preRef: HTMLPreElement;

	let isCopying = $state(false);

	const languages = extension.options.lowlight.listLanguages().sort();

	let defaultLanguage = $state(node.attrs.language);

	$effect(() => {
		if (!defaultLanguage) {
			defaultLanguage = 'plaintext';
			updateAttributes({ language: defaultLanguage });
		}
	});

	let open = $state(false);

	function copyCode() {
		isCopying = true;
		navigator.clipboard.writeText(preRef.innerText);
		setTimeout(() => {
			isCopying = false;
		}, 1000);
	}
</script>

<NodeViewWrapper
	class="code-wrapper group relative rounded bg-muted p-6 dark:bg-muted/20"
	draggable="false"
>
	<Popover.Root bind:open>
		<Popover.Trigger
			contenteditable="false"
			class={buttonVariants({
				variant: 'ghost',
				size: 'sm',
				class:
					'absolute left-2 top-2 h-4 rounded p-2 text-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100'
			})}
		>
			{defaultLanguage}
		</Popover.Trigger>
		<Popover.Content class="w-44 p-0">
			<Command.Root>
				<Command.Input placeholder="Search a language" />
				<Command.List>
					<Command.Empty>No framework found.</Command.Empty>
					<Command.Group>
						{#each languages as language}
							<Command.Item
								contenteditable="false"
								data-current={defaultLanguage === language}
								class="data-[current=true]:bg-muted"
								value={language}
								onclick={() => {
									defaultLanguage = language;
									updateAttributes({ language: defaultLanguage });
									open = false;
								}}
							>
								<span>{language}</span>
								{#if defaultLanguage === language}
									<Check class="size-3 ml-auto" />
								{/if}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
	<Button
		variant="ghost"
		class="absolute right-2 top-2 size-4 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
		onclick={copyCode}
	>
		{#if isCopying}
			<Check class="size-3 text-green-500" />
		{:else}
			<Copy class="size-3" />
		{/if}
	</Button>
	<pre bind:this={preRef}>
		<NodeViewContent as="code" class={`language-${defaultLanguage}`} {...node.attrs} />	
	</pre>
</NodeViewWrapper>
