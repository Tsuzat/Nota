<script lang="ts">
import EmojiPicker from "#lib/components/icons/emoji-picker.svelte";
import { buttonVariants } from "#lib/components/ui/button/button.svelte";
import * as Popover from "#lib/components/ui/popover/index.js";
import { cn } from "#lib/utils.js";
import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
} from "../../tiptap/index.js";

const { node, updateAttributes }: NodeViewProps = $props();

let emoji = $derived(node.attrs.emoji ?? "💡");
let searchTerm = $state("");
</script>

<NodeViewWrapper
  class={cn(
    "my-4 flex gap-3 rounded-lg border bg-muted p-4 transition-colors dark:bg-muted/50",
  )}
>
  <div contenteditable="false" class="mt-0.5 flex items-start select-none">
    <Popover.Root>
      <Popover.Trigger
        class={buttonVariants({
          variant: "ghost",
          size: "icon",
          class: "p-0! text-lg",
        })}
      >
        {emoji}
      </Popover.Trigger>
      <Popover.Content
        class="flex h-fit w-96 flex-col gap-1 p-0"
      >
        <EmojiPicker
          {searchTerm}
          onSelect={(emojiChar) => {
            updateAttributes({ emoji: emojiChar });
          }}
        />
      </Popover.Content>
    </Popover.Root>
  </div>

  <div class="min-w-2 flex-1 leading-relaxed">
    <NodeViewContent class="edra-callout-content" />
  </div>
</NodeViewWrapper>
