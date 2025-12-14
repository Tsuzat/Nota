<script lang="ts">
import SimpleToolTip from '@lib/components/custom/SimpleToolTip.svelte';
import ToggleMode from '@lib/components/custom/ToggleMode.svelte';
import { Key, Trash } from '@lucide/svelte';
import { type Editor, EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '@nota/ui/edra/shadcn/index.ts';
import type { FileType } from '@nota/ui/edra/utils.ts';
import { Button } from '@nota/ui/shadcn/button';
import { browser } from '$app/environment';
import defalutContent from './demo';

let content = $state(defalutContent);
let editor = $state<Editor>();
let hasAPIKEY = $state(browser ? localStorage.getItem('gemini_api_key') !== null : false);

const onFileSelect = async (_file: string) => {
  throw new Error('This is not available for Playground');
};

const onDropOrPaste = async (_file: File) => {
  throw new Error('This is not available for Playground');
};

const getAssets = async (_fileType: FileType) => {
  throw new Error('This is not available for Playground');
};

const setGeminiAPIKey = () => {
  const key = prompt(
    'To use AI features, please input your Gemini API Key. This will be stored in your localStore so you might want to delete the key later on'
  );
  if (key) {
    localStorage.setItem('gemini_api_key', key);
    hasAPIKEY = true;
  }
};
</script>

<main class="flex h-screen w-full flex-col overflow-hidden">
  <header
    class="relative mx-auto flex h-12 w-full max-w-3xl items-center justify-center gap-2"
  >
    <span class="text-center text-2xl font-bold"> Nota Playground </span>
    <div class="right-0 ml-auto flex items-center gap-2">
      {#if hasAPIKEY}
        <SimpleToolTip content="Delete Gemini API Key">
          <Button
            variant="destructive"
            size="icon-sm"
            onclick={() => {
              localStorage.removeItem("gemini_api_key");
              hasAPIKEY = false;
            }}
          >
            <Trash />
          </Button>
        </SimpleToolTip>
      {:else}
        <SimpleToolTip content="Set Gemini API Key">
          <Button
            variant="ghost"
            size="icon-sm"
            class="ml-auto"
            onclick={setGeminiAPIKey}
          >
            <Key />
          </Button>
        </SimpleToolTip>
      {/if}
      <ToggleMode />
    </div>
  </header>
  {#if editor && !editor?.isDestroyed}
    <EdraBubbleMenu {editor} />
    <EdraDragHandleExtended {editor} />
  {/if}
  <EdraEditor
    bind:editor
    {content}
    class="flex-1 grow flex-col overflow-auto p-8!"
    {onFileSelect}
    {onDropOrPaste}
    {getAssets}
  />
</main>
