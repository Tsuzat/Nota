<script lang="ts">
import { Button } from '@lib/components/ui/button';
import { Input } from '@lib/components/ui/input';
import Check from '@lucide/svelte/icons/check';
import Copy from '@lucide/svelte/icons/copy';
import Edit from '@lucide/svelte/icons/edit';
import Trash from '@lucide/svelte/icons/trash';
import ExternalLink from '@lucide/svelte/icons/external-link';
import type { Editor } from '@tiptap/core';
import BubbleMenu from '../../components/BubbleMenu.svelte';
    import type { ShouldShowProps } from '../../types';
  import { SimpleToolTip } from '@lib/components/custom';

interface Props {
  editor: Editor;
  parentElement?: HTMLElement;
}
const { editor, parentElement }: Props = $props();

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
    if (props.editor.isActive("link")) {
      return true;
    } else {
      isEditing = false;
      linkInput = undefined;
      return false;
    }
  }}
  options={{
    shift: true,
    autoPlacement: {
      allowedPlacements: ["top", "top-end", "top-start"],
    },
    strategy: "absolute",
    scrollTarget: parentElement,
  }}
  class="bg-popover flex h-fit w-fit items-center gap-0.5 rounded-lg border p-0!"
>
  {#if !isEditing}
    <SimpleToolTip content="Open Link in browser">
      <Button
        variant="link"
        href={link}
        class="max-w-120 truncate overflow-hidden p-1 text-ellipsis underline"
        target="_blank"
      >
        <ExternalLink />
      </Button>
    </SimpleToolTip>
    <SimpleToolTip content="Edit Link">
      <Button
        variant="ghost"
        size="icon"
        onclick={() => {
          isEditing = true;
          editor.commands.blur();
        }}
      >
        <Edit />
      </Button>
    </SimpleToolTip>
    <SimpleToolTip content="Copy Link">
      <Button
        variant="ghost"
        title="Copy Link"
        size="icon"
        onclick={() => {
          window.navigator.clipboard.writeText(link);
        }}
      >
        <Copy />
      </Button>
    </SimpleToolTip>
    <SimpleToolTip content="Remove Link">
      <Button
        variant="ghost"
        title="Remove Link"
        size="icon"
        onclick={() =>
          editor.chain().focus().extendMarkRange("link").unsetLink().run()}
      >
        <Trash />
      </Button>
    </SimpleToolTip>
  {:else}
    <form onsubmit={handleSubmit} class="flex max-w-120 items-center gap-0.5">
      <Input
        bind:value={linkInput}
        required
        type="url"
        placeholder="Type or paste a link"
      />
      <SimpleToolTip content="Set new link">
        <Button type="submit" size="icon">
          <Check />
        </Button>
      </SimpleToolTip>
    </form>
  {/if}
</BubbleMenu>
