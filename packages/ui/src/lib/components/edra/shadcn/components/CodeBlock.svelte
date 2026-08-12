<script lang="ts">
  import { Button, buttonVariants } from "@lib/components/ui/button/index.js";
  import {
    NodeViewContent,
    NodeViewWrapper,
    useEditorTransaction,
    type NodeViewProps,
  } from "../../tiptap/index.js";

  const { editor, node, updateAttributes, extension, getPos }: NodeViewProps =
    $props();

  import * as Popover from "@lib/components/ui/popover/index.js";
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";
  import * as Command from "@lib/components/ui/command/index.js";
  import { cn } from "@lib/utils.js";
  import strings from "../../strings.js";
  import { Sparkle } from "@lucide/svelte";
  import Tooltip from "./Tooltip.svelte";

  let preRef = $state<HTMLPreElement>();
  let isCopying = $state(false);
  const languages: string[] = $derived(
    extension.options.lowlight.listLanguages().sort(),
  );
  let defaultLanguage = $derived<string>(node.attrs.language ?? "plaintext");

  const changeLanguage = (language: string) => {
    updateAttributes({ language: language });
    defaultLanguage = language;
  };

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
    editor
      .chain()
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
  const transaction = useEditorTransaction(editor);
  const isEditable = () => {
    void transaction.version;
    return editor.isEditable;
  };
</script>

<NodeViewWrapper class="my-4 rounded-lg bg-muted pb-4 px-4 dark:bg-muted/20">
  <div
    class="mx-2 flex items-center z-0 justify-end gap-2 print:justify-start"
    contenteditable="false"
  >
    {#if defaultLanguage.toLowerCase() === "mermaid" && isEditable()}
      <Tooltip tooltip="Convert to Mermaid Diagram">
        <Button
          variant="ghost"
          size="icon-xs"
          class="print:hidden"
          onclick={convertToMermaid}
        >
          <Sparkle />
        </Button>
      </Tooltip>
    {/if}
    {#if isEditable()}
      <Popover.Root>
        <Tooltip tooltip="Change Language">
          <Popover.Trigger
            contenteditable="false"
            class={buttonVariants({
              variant: "ghost",
              size: "sm",
              class: "text-muted-foreground capitalize",
            })}
          >
            {defaultLanguage}
          </Popover.Trigger>
        </Tooltip>
        <Popover.Content
          class="max-h-96 h-auto w-42 p-0! text-primary!"
          portalProps={{ disabled: true, to: undefined }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onEscapeKeydown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Command.Root class="p-0!">
            <Command.Input
              placeholder={strings.extension.code.searchLanguagePlaceholder}
            />
            <Command.List>
              <Command.Empty
                >{strings.extension.code.searchLanguageEmpty}</Command.Empty
              >
              <Command.Group value="languages">
                {#each languages as language (language)}
                  <Command.Item
                    value={language}
                    onSelect={() => changeLanguage(language)}
                    onclick={() => changeLanguage(language)}
                    class="text-primary capitalize"
                  >
                    <Check
                      class={cn(language !== defaultLanguage && "invisible")}
                    />
                    {language}
                  </Command.Item>
                {/each}
              </Command.Group>
            </Command.List>
          </Command.Root>
        </Popover.Content>
      </Popover.Root>
    {:else}
      <span
        class={buttonVariants({
          variant: "ghost",
          size: "sm",
          class: "text-muted-foreground capitalize",
        })}>{defaultLanguage}</span
      >
    {/if}
    <Button
      variant="ghost"
      size="icon-xs"
      class="text-muted-foreground print:hidden"
      onclick={copyCode}
    >
      {#if isCopying}
        <Check class=" text-green-500" />
      {:else}
        <Copy />
      {/if}
    </Button>
  </div>
  <pre bind:this={preRef} draggable={false} spellcheck="false">
		<NodeViewContent
      as="code"
      class={`language-${defaultLanguage}`}
      {...node.attrs}
    />
	</pre>
</NodeViewWrapper>
