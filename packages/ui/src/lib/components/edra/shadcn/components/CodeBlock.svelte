<script lang="ts">
  import { Button, buttonVariants } from "@lib/components/ui/button";
  import type { NodeViewProps } from "@tiptap/core";
  import { NodeViewContent, NodeViewWrapper } from "svelte-tiptap";

  const { editor, node, updateAttributes, extension, getPos }: NodeViewProps = $props();

  import * as Popover from "@lib/components/ui/popover";
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";
  import * as Command from "@lib/components/ui/command";
  import { cn } from "@lib/utils";
  import { icons } from "@lib/icons/index";
  import { SimpleToolTip } from "@lib/components/custom";

  let preRef = $state<HTMLPreElement>();

  let isCopying = $state(false);

  const languages: string[] = $derived(
    extension.options.lowlight.listLanguages().sort(),
  );

  let defaultLanguage = $derived(String(node.attrs.language) ?? "Plain Text");
  const isMermaid = $derived(defaultLanguage.toLowerCase() === "mermaid");

  $effect(() => {
    updateAttributes({ language: defaultLanguage });
  });

  function copyCode() {
    if (!preRef) return;
    isCopying = true;
    navigator.clipboard.writeText(preRef.innerText);
    setTimeout(() => {
      isCopying = false;
    }, 1000);
  }

  function convertToMermaid() {
    const code = node.textContent;
    const pos = getPos();
    if (typeof pos !== "number") return;

    editor.chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .insertContentAt(pos, {
        type: "mermaid",
        content: [
          {
            type: "text",
            text: code || "",
          },
        ],
      })
      .run();
  }
</script>

<NodeViewWrapper class="code-wrapper" draggable={false} spellcheck={false}>
  <div
    class="code-wrapper-tile justify-end print:justify-start"
    contenteditable="false"
  >
    {#if isMermaid}
      <SimpleToolTip content="Convert to mermaid diagram">
        <Button variant="ghost" size="icon-xs" class="print:hidden" onclick={convertToMermaid}>
          <icons.Workflow />
        </Button>
      </SimpleToolTip>
    {/if}
    <Popover.Root>
      <Popover.Trigger
        contenteditable="false"
        disabled={!editor.isEditable}
        class={buttonVariants({
          variant: "ghost",
          class: "h-6! p-1 w-fit rounded-sm capitalize text-muted-foreground",
        })}
      >
        {defaultLanguage}
      </Popover.Trigger>
      <Popover.Content
        class="p-0 w-48 max-h-96 text-primary! print:hidden"
        portalProps={{ disabled: true, to: undefined }}
      >
        <Command.Root>
          <Command.Input placeholder="Search Languages..." />
          <Command.List>
            <Command.Empty>No Language found.</Command.Empty>
            <Command.Group value="languages">
              {#each languages as language (language)}
                <Command.Item
                  value={language}
                  onSelect={() => (defaultLanguage = language)}
                  class="capitalize text-primary"
                >
                  <icons.Check
                    class={cn(
                      language !== defaultLanguage && "text-transparent",
                    )}
                  />
                  {language}
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
    <Button
      variant="ghost"
      size="icon-xs"
      class="print:hidden"
      onclick={copyCode}
    >
      {#if isCopying}
        <Check class="size-4 text-green-500" />
      {:else}
        <Copy class="size-4" />
      {/if}
    </Button>
  </div>
  <pre bind:this={preRef} draggable={false}>
		<NodeViewContent
      as="code"
      class={`language-${defaultLanguage}`}
      {...node.attrs}
    />
	</pre>
</NodeViewWrapper>
