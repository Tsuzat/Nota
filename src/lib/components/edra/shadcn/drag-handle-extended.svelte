<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { onMount } from 'svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { DragHandlePlugin } from '@tiptap/extension-drag-handle';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Node } from '@tiptap/pm/model';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import RemoveFormatting from '@lucide/svelte/icons/remove-formatting';
	import Duplicate from '@lucide/svelte/icons/copy';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import Delete from '@lucide/svelte/icons/trash-2';
	import { NodeSelection } from '@tiptap/pm/state';
	import Plus from '@lucide/svelte/icons/plus';
	import { offset, size } from '@floating-ui/dom';
	import Repeat2 from '@lucide/svelte/icons/repeat-2';
	import commands from '../commands/toolbar-commands';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	let currentNode: Node | null = $state(null);
	let currentNodePos: number = $state(-1);
	let open = $state(false);

	const pluginKey = 'globalDragHandle';
	let element = $state(document.createElement('div'));

	const turnIntoCommand = Object.values(commands)
		.flat()
		.filter((c) => c.turnInto !== undefined);

	onMount(() => {
		const plugin = DragHandlePlugin({
			element,
			pluginKey,
			editor,
			computePositionConfig: {
				strategy: 'absolute',
				placement: 'left-start',
				middleware: [offset({ mainAxis: 0, crossAxis: 4, alignmentAxis: -4 })]
			},
			onNodeChange
		});
		editor.registerPlugin(plugin.plugin);
		return () => editor.unregisterPlugin(pluginKey);
	});

	const onNodeChange = (data: { editor: Editor; node: Node | null; pos: number }) => {
		if (data.node) currentNode = data.node;
		currentNodePos = data.pos;
	};

	const handleRemoveFormatting = () => {
		const chain = editor.chain();
		chain.setNodeSelection(currentNodePos).unsetAllMarks();
		chain.setParagraph();
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

	const insertNode = () => {
		if (currentNodePos === -1) return;
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
	};
</script>

<div bind:this={element} class="flex items-center gap-0 pr-2 transition-all duration-300">
	<Button variant="ghost" class="size-7! rounded-sm" onclick={insertNode}>
		<Plus />
	</Button>
	<Button
		variant="ghost"
		class="size-7! rounded-sm"
		onclick={() => {
			open = !open;
			if (open) editor.commands.selectNodeForward();
		}}
	>
		<GripVertical />
	</Button>
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger class="sr-only">
			<span>Drag Handle</span>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading class="capitalize">
					{currentNode?.type.name}
					{console.log('CURRENT NODE DATA = ', currentNode?.content.toJSON())}
				</DropdownMenu.GroupHeading>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>
						<Repeat2 />
						Turn Into
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent class="h-56 overflow-auto">
						{#each turnIntoCommand as command (command)}
							{@const Icon = command.icon}
							<DropdownMenu.Item
								onclick={() => {
									if (currentNode && currentNodePos)
										command.turnInto?.(editor, currentNode, currentNodePos);
								}}
							>
								<Icon />
								<span>{command.tooltip}</span>
								<DropdownMenu.Shortcut>{command.shortCut}</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			</DropdownMenu.Group>
			<DropdownMenu.Item onclick={handleRemoveFormatting}>
				<RemoveFormatting />
				Remove Formatting
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={handleDuplicate}>
				<Duplicate />
				Duplicate
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={handleCopyToClipboard}>
				<Clipboard />
				Copy Content
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={handleDelete}>
				<Delete class="text-destructive" />
				Delete Node
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
