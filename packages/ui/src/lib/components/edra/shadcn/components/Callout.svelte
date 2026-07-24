<script lang="ts">
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '../../tiptap/index.js';
import * as Popover from '@lib/components/ui/popover/index.js';
import { cn } from '@lib/utils.js';
import { buttonVariants } from '@lib/components/ui/button/button.svelte';
import EmojiPicker from '@lib/icons/emoji-picker.svelte';

const { node, updateAttributes }: NodeViewProps = $props();

let emoji = $derived(node.attrs.emoji ?? '💡');

</script>

<NodeViewWrapper
	class={cn('my-4 flex gap-3 rounded-lg border bg-muted p-4 transition-colors dark:bg-muted/50')}
>
	<div contenteditable="false" class="mt-0.5 flex items-start select-none">
		<Popover.Root>
			<Popover.Trigger
				class={buttonVariants({ variant: 'ghost', size: 'icon', class: 'text-lg' })}
			>
				{emoji}
			</Popover.Trigger>
			<Popover.Content strategy="absolute" class="size-fit p-0!">
				<EmojiPicker onSelect={(emoji: string) => updateAttributes({emoji: emoji.split(":")[1]})} />
			</Popover.Content>
		</Popover.Root>
	</div>
	<div class="min-w-2 flex-1 leading-relaxed">
		<NodeViewContent class="edra-callout-content" />
	</div>
</NodeViewWrapper>
