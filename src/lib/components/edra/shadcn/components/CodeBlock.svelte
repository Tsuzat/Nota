<script lang="ts">
	import { NodeViewWrapper, NodeViewContent } from 'svelte-tiptap';
	import type { NodeViewProps } from '@tiptap/core';
	import { Button } from '$lib/components/ui/button';
	const { editor, node, updateAttributes, extension }: NodeViewProps = $props();
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import * as Select from '$lib/components/ui/select';

	let preRef = $state<HTMLPreElement>();

	let isCopying = $state(false);

	const languages: string[] = extension.options.lowlight.listLanguages().sort();

	let defaultLanguage = $state(node.attrs.language);

	$effect(() => {
		updateAttributes({ language: defaultLanguage });
	});

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
	<div class="code-wrapper-tile justify-end print:justify-start" contenteditable="false">
		<Select.Root type="single" name="Languages" bind:value={defaultLanguage}>
			<Select.Trigger
				contenteditable="false"
				disabled={!editor.isEditable}
				class="dark:hover:bg-muted/50! hover:text-foreground hover:bg-muted text-muted-foreground h-6! gap-0! border-0! bg-transparent! px-1! py-0! capitalize ring-0! [&_svg]:size-2"
			>
				{defaultLanguage}
			</Select.Trigger>
			<Select.Content class="duration-300">
				{#each languages as language (language)}
					<Select.Item
						label={language}
						value={language}
						contenteditable="false"
						data-current={defaultLanguage === language}
						class="data-[current=true]:bg-muted capitalize"
					/>
				{/each}
			</Select.Content>
		</Select.Root>
		<Button
			variant="ghost"
			class="text-muted-foreground size-6! rounded-sm p-0.5 print:hidden"
			onclick={copyCode}
		>
			{#if isCopying}
				<Check class="size-4 text-green-500" />
			{:else}
				<Copy class="size-4" />
			{/if}
		</Button>
	</div>
	<pre bind:this={preRef} draggable={false}>
		<NodeViewContent as="code" class={`language-${defaultLanguage}`} {...node.attrs} />
	</pre>
</NodeViewWrapper>
