<script lang="ts">
	import type { ShouldShowProps } from '../../types.js';
	import { type Editor } from '@tiptap/core';
	import ArrowLeftFromLine from '@lucide/svelte/icons/arrow-left-from-line';
	import ArrowRightFromLine from '@lucide/svelte/icons/arrow-right-from-line';

	import Trash from '@lucide/svelte/icons/trash';
	import Button from '$lib/components/ui/button/button.svelte';
	import { isColumnGripSelected } from '../../extensions/table/utils.js';
	import EdraToolTip from '../components/EdraToolTip.svelte';
	import BubbleMenu from '../../components/BubbleMenu.svelte';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();
</script>

<BubbleMenu
	{editor}
	pluginKey="table-col-menu"
	shouldShow={(props: ShouldShowProps) => {
		if (!props.editor.isEditable) return false;
		if (!props.state) {
			return false;
		}
		return isColumnGripSelected({
			editor: props.editor,
			view: props.view,
			state: props.state,
			from: props.from
		});
	}}
	class="bg-background flex h-fit w-fit items-center gap-1 rounded-lg border shadow-lg"
>
	<EdraToolTip tooltip="Add Column After">
		<Button
			variant="ghost"
			size="icon"
			class="size-7"
			onclick={() => editor.chain().focus().addColumnAfter().run()}
		>
			<ArrowRightFromLine />
		</Button>
	</EdraToolTip>
	<EdraToolTip tooltip="Add Column Before">
		<Button
			variant="ghost"
			size="icon"
			class="size-7"
			onclick={() => editor.chain().focus().addColumnBefore().run()}
		>
			<ArrowLeftFromLine />
		</Button>
	</EdraToolTip>

	<EdraToolTip tooltip="Delete This Column">
		<Button
			variant="ghost"
			size="icon"
			class="size-7"
			onclick={() => editor.chain().focus().deleteColumn().run()}
		>
			<Trash />
		</Button>
	</EdraToolTip>
</BubbleMenu>
