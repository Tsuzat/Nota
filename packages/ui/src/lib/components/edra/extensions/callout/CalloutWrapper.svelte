<script lang="ts">
import { buttonVariants } from '@lib/components/ui/button';
import * as Popover from '@lib/components/ui/popover';
import EmojiPicker from '@lib/icons/emoji-picker.svelte';
import type { NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from 'svelte-tiptap';
const { editor, node, updateAttributes }: NodeViewProps = $props();

const { emoji } = $derived(node.attrs);
</script>

<NodeViewWrapper class="callout-wrapper">
  <div
    class="flex bg-muted items-center-safe dark:bg-muted/25 gap-2 rounded-md p-2"
  >
    <Popover.Root>
      <Popover.Trigger
        class={buttonVariants({ variant: "ghost", size: "icon-sm" })}
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

    <NodeViewContent {...node.attrs} />
  </div>
</NodeViewWrapper>
