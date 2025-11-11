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
	import { offset } from '@floating-ui/dom';
	import Repeat2 from '@lucide/svelte/icons/repeat-2';
	import commands from '../commands/toolbar-commands';
	import { Palette } from '@lucide/svelte';
	import { quickcolors } from '../utils';

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
	<Button
		variant="ghost"
		class="size-7! rounded-sm"
		onclick={() => {
			open = !open;
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
				</DropdownMenu.GroupHeading>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger openDelay={300}>
						<Repeat2 />
						Turn Into
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent class="max-h-96 overflow-auto duration-300">
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
								<DropdownMenu.Shortcut class="bg-background rounded border p-0.5"
									>{command.shortCut}</DropdownMenu.Shortcut
								>
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			</DropdownMenu.Group>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger openDelay={300}>
					<Palette />
					Colors
				</DropdownMenu.SubTrigger>
				<DropdownMenu.Content side="right" class="max-h-96 overflow-auto duration-300">
					<DropdownMenu.Group>
						<DropdownMenu.Label class="text-muted-foreground text-sm"
							>Text Colors</DropdownMenu.Label
						>
						{@const currentColor = editor.getAttributes('textStyle').color as string}
						{#each quickcolors as color (color.label)}
							<DropdownMenu.CheckboxItem
								checked={currentColor === color.value}
								title={color.label}
								onclick={() => {
									if (color.value === '' || color.label === 'Default')
										editor.chain().setNodeSelection(currentNodePos).unsetColor().run();
									else editor.chain().setNodeSelection(currentNodePos).setColor(color.value).run();
								}}
							>
								<span style={`color: ${color.value};`}>A</span>
								<span class="capitalize">{color.label}</span>
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Label class="text-muted-foreground text-sm"
							>Highlight Color</DropdownMenu.Label
						>
						{@const currentHighlight = editor.getAttributes('highlight').color as string}
						{#each quickcolors as color (color.label)}
							<DropdownMenu.CheckboxItem
								checked={currentHighlight === color.value}
								title={color.label}
								onclick={() => {
									if (color.value === '' || color.label === 'Default')
										editor.chain().setNodeSelection(currentNodePos).unsetHighlight().run();
									else
										editor
											.chain()
											.setNodeSelection(currentNodePos)
											.setHighlight({ color: color.value })
											.run();
								}}
							>
								<span class="size-4 rounded-full border" style={`background-color: ${color.value};`}
								></span>
								<span class="capitalize">{color.label}</span>
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Sub>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={insertNode}>
				<Plus />
				Insert Next
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={handleRemoveFormatting}>
				<RemoveFormatting />
				Remove Formatting
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={handleDuplicate}>
				<Duplicate />
				Duplicate
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={handleCopyToClipboard}>
				<Clipboard />
				Copy Content
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={handleDelete}>
				<Delete class="text-destructive" />
				Delete Node
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
