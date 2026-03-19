<script lang="ts">
import { buttonVariants } from '@lib/components/ui/button';
import * as Popover from '@lib/components/ui/popover';
import EmojiPicker from '@lib/icons/emoji-picker.svelte';
import type { NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from 'svelte-tiptap';
const { editor, node, updateAttributes }: NodeViewProps = $props();

const { emoji } = $derived(node.attrs);
</script>

<NodeViewWrapper class="callout-wrapper my-4">
  <div class="flex bg-muted items-start dark:bg-muted/30 gap-2 rounded-lg p-4">
    <div class="mt-1">
      <Popover.Root>
        <Popover.Trigger
          class={buttonVariants({
            variant: "ghost",
            size: "icon-sm",
          })}
        >
          {emoji}
        </Popover.Trigger>
        <Popover.Content
          side="right"
          class="p-0! w-fit! bg-popover/50 backdrop-blur-2xl"
        >
          <EmojiPicker
            onSelect={(emoji) => {
              if (!editor.isEditable) return;
              updateAttributes({ emoji: emoji.replace("emoji:", "") });
            }}
          />
        </Popover.Content>
      </Popover.Root>
    </div>
    <div class="flex-1 mt-1 min-w-2 leading-relaxed">
      <NodeViewContent />
    </div>
  </div>
</NodeViewWrapper>
