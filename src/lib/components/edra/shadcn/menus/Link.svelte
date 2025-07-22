<script lang="ts">
	import type { ShouldShowProps } from '../../types.js';
	import BubbleMenu from '../../components/BubbleMenu.svelte';
	import type { Editor } from '@tiptap/core';
	import { Button } from '$lib/components/ui/button';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash from '@lucide/svelte/icons/trash';
	import { Input } from '$lib/components/ui/input';
	import { Check, Edit } from '@lucide/svelte';
	import SimpleTooltip from '$lib/components/custom/simple-tooltip.svelte';
	import { ISTAURI } from '$lib/utils.js';
	import { openUrl } from '@tauri-apps/plugin-opener';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	let link = $derived.by(() => editor.getAttributes('link').href);

	let isEditing = $state(false);

	let linkInput = $derived(link);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!linkInput || linkInput.trim() === '') return;
		isEditing = false;
		editor.chain().focus().extendMarkRange('link').setLink({ href: linkInput }).run();
	}
</script>

<BubbleMenu
	{editor}
	pluginKey="link-bubble-menu"
	shouldShow={(props: ShouldShowProps) => {
		if (props.editor.isActive('link')) {
			return true;
		} else {
			isEditing = false;
			linkInput = undefined;
			return false;
		}
	}}
	options={{
		strategy: 'fixed'
	}}
	class="bg-popover flex h-fit w-fit items-center gap-1 rounded-lg border p-1 shadow-lg"
>
	{#if !isEditing}
		<Button
			variant="link"
			href={link}
			onclick={async () => {
				if (ISTAURI) {
					await openUrl(link);
				}
			}}
			class="max-w-80 truncate overflow-hidden p-1 text-ellipsis underline"
			target="_blank"
		>
			{link}
		</Button>
		<SimpleTooltip content="Edit Link">
			<Button
				variant="ghost"
				size="icon"
				class="size-7"
				onclick={() => {
					isEditing = true;
					editor.commands.blur();
				}}
			>
				<Edit />
			</Button>
		</SimpleTooltip>
		<SimpleTooltip content="Copy Link">
			<Button
				variant="ghost"
				title="Copy Link"
				size="icon"
				class="size-7"
				onclick={() => {
					window.navigator.clipboard.writeText(link);
				}}
			>
				<Copy />
			</Button>
		</SimpleTooltip>
		<SimpleTooltip content="Remove Link">
			<Button
				variant="ghost"
				title="Remove Link"
				size="icon"
				class="size-7"
				onclick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
			>
				<Trash />
			</Button>
		</SimpleTooltip>
	{:else}
		<form onsubmit={handleSubmit} class="flex w-80 items-center gap-2">
			<Input bind:value={linkInput} required type="url" placeholder="Type or paste a link" />
			<SimpleTooltip content="Set new link">
				<Button type="submit" size="icon">
					<Check />
				</Button>
			</SimpleTooltip>
		</form>
	{/if}
</BubbleMenu>
