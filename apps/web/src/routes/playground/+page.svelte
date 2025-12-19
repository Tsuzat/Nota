<script lang="ts">
import ToggleMode from '@lib/components/custom/ToggleMode.svelte';
import { Button, buttonVariants } from '@lib/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@lib/components/ui/dialog';
import { type Editor, EdraBubbleMenu, EdraDragHandleExtended, EdraEditor } from '@nota/ui/edra/shadcn/index.ts';
import type { FileType } from '@nota/ui/edra/utils.ts';
import { onMount } from 'svelte';
import defalutContent from './demo';

let content = $state(defalutContent);
let editor = $state<Editor>();

const onFileSelect = async (_file: string) => {
  throw new Error('This is not available for Playground');
};

const onDropOrPaste = async (_file: File) => {
  throw new Error('This is not available for Playground');
};

const getAssets = async (_fileType: FileType) => {
  throw new Error('This is not available for Playground');
};

let open = $state(false);

onMount(() => {
  open = true;
});
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only">
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Some Features May Not Work</DialogTitle>
    <DialogDescription>
      This is a playgroud. This is to give you an experience of Nota and it's
      features. But, Some features may not work, like AI, Media Uploads, and
      some more features.
    </DialogDescription>
    <DialogFooter>
      <DialogClose class={buttonVariants({})}>Close</DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>

<main class="flex h-screen w-full flex-col overflow-hidden">
  <header
    class="relative mx-auto flex h-12 w-full max-w-3xl items-center justify-center gap-2"
  >
    <span class="text-center text-2xl font-bold"> Nota Playground </span>

    <ToggleMode />
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
