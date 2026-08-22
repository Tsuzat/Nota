<script lang="ts">
import type { Snippet } from "svelte";
import * as Popover from "../ui/popover";
import * as Tabs from "../ui/tabs";
import EmbedUrl from "./embed-url.svelte";
import EmojiPicker from "./emoji-picker.svelte";
import LucidePicker from "./lucide-picker.svelte";

interface Props {
	open?: boolean;
	icon?: string;
	onSelect?: (icon: string) => void;
	onClose?: () => void;
	side?: "left" | "right" | "top" | "bottom" | undefined;
	children?: Snippet<[]>;
}

let {
	open = $bindable(false),
	icon = $bindable(),
	onSelect,
	onClose,
	side,
	children,
}: Props = $props();
</script>

<Popover.Root
  bind:open
  onOpenChange={(value: boolean) => {
    if (!value) onClose?.();
  }}
>
  {#if children}
    <Popover.Trigger>
      {@render children()}
    </Popover.Trigger>
  {/if}
  <Popover.Content class="flex h-fit w-96 flex-col gap-1 p-0" {side}>
    <Tabs.Root value="emojis">
      <Tabs.List class="w-full">
        <Tabs.Trigger value="emojis">Emoji</Tabs.Trigger>
        <Tabs.Trigger value="icons">Icon</Tabs.Trigger>
        <Tabs.Trigger value="url">Embed Url</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="icons">
        <LucidePicker {onSelect} />
      </Tabs.Content>
      <Tabs.Content value="emojis">
        <EmojiPicker {onSelect} />
      </Tabs.Content>
      <Tabs.Content value="url">
        <EmbedUrl {onSelect} />
      </Tabs.Content>
    </Tabs.Root>
  </Popover.Content>
</Popover.Root>
