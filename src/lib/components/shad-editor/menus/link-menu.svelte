<script lang="ts">
	import { type Editor } from '@tiptap/core';
	import { BubbleMenu } from 'svelte-tiptap';
	import type { ShouldShowProps } from './types.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Copy, Pencil, Trash, Check } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn, validateURL } from '$lib/utils.js';
	interface Props {
		editor: Editor;
	}

	let { editor }: Props = $props();

	let link = $derived.by(() => editor.getAttributes('link').href);

	let isEditing = $state(false);

	function setLink(url: string) {
		if (url.trim() === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}

	let linkInput = $state('');
	let isLinkValid = $state(true);

	$effect(() => {
		isLinkValid = validateURL(linkInput);
	});
</script>

<BubbleMenu
	{editor}
	pluginKey="link-menu"
	shouldShow={(props: ShouldShowProps) => {
		if (props.editor.isActive('link')) {
			return true;
		} else {
			isEditing = false;
			linkInput = '';
			isLinkValid = true;
			return false;
		}
	}}
	class="flex h-fit w-fit items-center gap-1 rounded border bg-background p-1 shadow-lg -z-50"
>
	{#if isEditing}
		<Input
			placeholder="Enter link to attach.."
			type="url"
			bind:value={linkInput}
			class={cn('w-full border-2', isLinkValid ? 'border-green-500' : 'border-red-500')}
		/>
	{:else}
		<Button variant="link" href={link} class="max-w-80 p-1" target="_blank">
			<span class="w-full overflow-hidden text-ellipsis">
				{link}
			</span>
		</Button>
	{/if}
	{#if isEditing}
		<Button
			variant="ghost"
			disabled={!isLinkValid}
			title={isLinkValid ? 'Set Link' : 'Invalid URL'}
			class="size-7 p-1"
			onclick={() => {
				isEditing = false;
				editor.commands.focus();
				setLink(linkInput);
			}}
		>
			<Check />
		</Button>
	{:else}
		<Button
			variant="ghost"
			title="Edit Link"
			class="size-7 p-1"
			onclick={() => {
				isEditing = true;
				linkInput = editor.getAttributes('link').href;
				editor.commands.blur();
			}}
		>
			<Pencil />
		</Button>
		<Button
			variant="ghost"
			title="Copy Link"
			class="size-7 p-1"
			onclick={() => {
				navigator.clipboard.writeText(link);
			}}
		>
			<Copy />
		</Button>
		<Button
			variant="ghost"
			title="Remove Link"
			class="size-7 p-1"
			onclick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
		>
			<Trash />
		</Button>
	{/if}
</BubbleMenu>
