<script lang="ts">
	import { type Editor } from '@tiptap/core';
	import { onMount } from 'svelte';
	import { DragHandlePlugin } from '@tiptap-pro/extension-drag-handle';
	import { Button } from '$lib/components/ui/button';
	import { GripVertical, Plus, Trash2, RemoveFormatting, Layers2, Clipboard } from 'lucide-svelte';
	import type { Node } from '@tiptap/pm/model';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { NodeSelection } from '@tiptap/pm/state';
	interface Props {
		editor: Editor;
	}

	let { editor }: Props = $props();

	const pluginKey = 'SvelteTiptapDragHandle';

	let element: HTMLElement;

	onMount(() => {
		const plugin = DragHandlePlugin({
			pluginKey,
			editor,
			element,
			tippyOptions: {
				zIndex: 0
			},
			onNodeChange(data) {
				handleNodeChange(data);
			}
		});
		editor.registerPlugin(plugin);
		return () => editor.unregisterPlugin(pluginKey);
	});

	// Node change
	let currentNode: Node | null = $state(null);
	let currentNodePos: number = $state(-1);
	let showDragMenu = $state(false);

	const handleNodeChange = (data: { node: Node | null; editor: Editor; pos: number }) => {
		if (data.node) currentNode = data.node;
		currentNodePos = data.pos;
	};

	const handleRemoveFormatting = () => {
		const chain = editor.chain();
		chain.setNodeSelection(currentNodePos).unsetAllMarks();
		if (currentNode?.type.name !== 'paragraph') {
			chain.setParagraph();
		}
		chain.run();
	};

	const handleDuplicate = () => {
		editor.commands.setNodeSelection(currentNodePos);
		const selectedNode =
			editor.state.selection.$anchor.node(1) || (editor.state.selection as NodeSelection).node;
		editor
			.chain()
			.setMeta('hideDragHandle', true)
			.insertContentAt(currentNodePos + (currentNode?.nodeSize || 0), selectedNode.toJSON())
			.run();
	};

	const handleCopyToClipboard = () => {
		editor.chain().setMeta('hideDragHandle', true).setNodeSelection(currentNodePos).run();
		/**
		 * !FIXME: document.execCommand is deprecated, use navigator.clipboard.writeText instead
		 */
		document.execCommand('copy');
	};

	const handleDelete = () => {
		editor
			.chain()
			.setMeta('hideDragHandle', true)
			.setNodeSelection(currentNodePos)
			.deleteSelection()
			.run();
	};

	const handleAddNode = () => {
		if (currentNodePos !== -1) {
			const currentNodeSize = currentNode?.nodeSize || 0;
			const insertPos = currentNodePos + currentNodeSize;
			const currentNodeIsEmptyParagraph =
				currentNode?.type.name === 'paragraph' && currentNode?.content?.size === 0;
			const focusPos = currentNodeIsEmptyParagraph ? currentNodePos + 2 : insertPos + 2;
			editor
				.chain()
				.command(({ dispatch, tr, state }) => {
					if (dispatch) {
						if (currentNodeIsEmptyParagraph) {
							tr.insertText('/', currentNodePos, currentNodePos + 1);
						} else {
							tr.insert(
								insertPos,
								state.schema.nodes.paragraph.create(null, [state.schema.text('/')])
							);
						}

						return dispatch(tr);
					}

					return true;
				})
				.focus(focusPos)
				.run();
		}
	};
</script>

<div
	bind:this={element}
	class="flex relative py-0.5 cursor-grab overflow-hidden items-center text-muted-foreground"
>
	<Button
		variant="ghost"
		class="size-6 p-0 rounded-sm text-muted-foreground"
		onclick={handleAddNode}
	>
		<Plus />
	</Button>
	<Button
		variant="ghost"
		class="size-6 p-0 rounded-sm text-muted-foreground"
		onclick={() => {
			showDragMenu = !showDragMenu;
		}}
	>
		<GripVertical />
	</Button>
	<DropdownMenu.Root bind:open={showDragMenu}>
		<DropdownMenu.Trigger class="absolute bottom-0 right-0">
			<span class="sr-only">Open Dropdown</span>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Item onclick={handleRemoveFormatting}>
				<RemoveFormatting class="mr-2" />
				<span>Remove Formatting</span>
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={handleDuplicate}>
				<Layers2 class="mr-2" />
				<span>Duplicate</span>
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={handleCopyToClipboard}>
				<Clipboard class="mr-2" />
				<span>Copy To Clipboard</span>
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-destructive" onclick={handleDelete}>
				<Trash2 class="mr-2" />
				<span>Delete</span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
