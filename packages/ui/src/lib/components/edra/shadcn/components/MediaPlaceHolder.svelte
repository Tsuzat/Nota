<script lang="ts">
import AudioLines from "@lucide/svelte/icons/audio-lines";
import CodeXml from "@lucide/svelte/icons/code-xml";
import Image from "@lucide/svelte/icons/image";
import Video from "@lucide/svelte/icons/video";
import { type NodeViewProps } from "@tiptap/core";
import { BarSpinner } from "#lib/components/icons/index.js";
import { Button } from "#lib/components/ui/button/index.js";
import { Input } from "#lib/components/ui/input/index.js";
import * as Popover from "#lib/components/ui/popover/index.js";
import * as Tabs from "#lib/components/ui/tabs/index.js";
import { NodeViewWrapper } from "../../tiptap/index.js";
import { FileType } from "../../utils.js";

const { editor, node }: NodeViewProps = $props();
let open = $state(false);
const mediaType = $derived<FileType>(node.attrs.mediaType);
let url = $state("");
let isUploading = $state(false);

async function handleFileSubmit() {
	const onUpload = editor.storage.mediaPlaceholder?.onUpload;
	open = false;
	if (onUpload) {
		isUploading = true;
		try {
			const src = await onUpload(mediaType);
			if (src) {
				setMediaFn(src);
			}
		} catch (error) {
			console.error("Failed to upload media:", error);
		} finally {
			isUploading = false;
		}
	} else {
		editor.commands.uploadMedia(mediaType);
	}
}

const mediaTypeData = $derived.by(() => {
	switch (mediaType) {
		case FileType.AUDIO:
			return {
				icon: AudioLines,
				text: "Insert An Audio File",
			};
		case FileType.VIDEO:
			return {
				icon: Video,
				text: "Insert An Video File",
			};
		case FileType.IMAGE:
			return {
				icon: Image,
				text: "Insert An Image File",
			};
		default:
			return {
				icon: CodeXml,
				text: "Insert An IFrame",
			};
	}
});

function setMediaFn(src: string) {
	if (mediaType === FileType.AUDIO) {
		editor.chain().focus().setAudio({ src }).run();
	} else if (mediaType === FileType.VIDEO) {
		editor.chain().focus().setVideo({ src }).run();
	} else if (mediaType === FileType.IMAGE) {
		editor.chain().focus().setImage({ src }).run();
	} else {
		editor.chain().focus().setIframe({ src }).run();
	}
}
</script>

<NodeViewWrapper class="my-2 w-full!">
  {@const Icon = mediaTypeData?.icon}
  {@const text = mediaTypeData?.text}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    role="button"
    tabindex={1}
    class="flex min-h-14 w-full items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4 transition-colors hover:bg-muted/50"
    onclick={() => (open = true)}
  >
    {#if isUploading}
      <BarSpinner />
      <span class="text-sm text-muted-foreground" contenteditable={false}
        >Uploading...</span
      >
    {:else}
      <Icon class="size-4 text-muted-foreground" />
      <span class="text-sm text-muted-foreground" contenteditable={false}
        >{text}</span
      >
    {/if}

    <Popover.Root bind:open>
      <Popover.Trigger class="sr-only left-1/2"></Popover.Trigger>
      <Popover.Content portalProps={{ to: undefined }}>
        <Tabs.Root value="link" class="w-full">
          <Tabs.List>
            <Tabs.Trigger value="link">Link</Tabs.Trigger>
            {#if mediaType !== FileType.IFRAME}
              <Tabs.Trigger value="file">File</Tabs.Trigger>
            {/if}
          </Tabs.List>
          <Tabs.Content value="link">
            <form class="flex flex-col gap-2">
              <Input
                type="url"
                placeholder="https://example.com..."
                bind:value={url}
              />
              <Button
                type="submit"
                class="capitalize"
                onclick={() => setMediaFn(url)}
                >Insert {mediaType.replace("/*", "")}</Button
              >
            </form>
          </Tabs.Content>
          {#if mediaType !== FileType.IFRAME}
            <Tabs.Content value="file">
              <span class="text-sm text-muted-foreground">Upload File</span>
              <Button
                type="submit"
                onclick={handleFileSubmit}
                class="capitalize w-full"
                disabled={isUploading}
              >
                Upload {mediaType.replace("/*", "")}
              </Button>
            </Tabs.Content>
          {/if}
        </Tabs.Root>
      </Popover.Content>
    </Popover.Root>
  </div>
</NodeViewWrapper>
