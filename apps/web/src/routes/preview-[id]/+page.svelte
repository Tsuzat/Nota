<script lang="ts">
import { ToggleMode } from '@lib/components/custom';
import type { Editor } from '@lib/components/edra/tiptap/index.js';
import { createEditor, Edra } from '@nota/ui/edra/shadcn/index.js';
import { IconRenderer } from '@nota/ui/icons';
import { Button } from '@nota/ui/shadcn/button';
import { Skeleton } from '@nota/ui/shadcn/skeleton';
import { onMount } from 'svelte';
import Applogo from '$lib/components/custom/applogo.svelte';

const { data } = $props();

let editor = $state<Editor>();
let words = $state(0);

onMount(() => {
  editor = createEditor({
    editable: false,
  });
  if (editor) {
    editor.commands.setContent(data.note.content ?? null, {
      contentType: 'json',
    });
    words = editor.storage.characterCount.words() ?? 0;
  }
});
</script>

<svelte:head>
  <title>{data.note.name || "Shared Note"} | Nota</title>
  <meta
    name="description"
    content="Read '{data.note.name ||
      'Untitled'}' on Nota, a fast, local-first note-taking and AI workspace."
  />
  <meta property="og:type" content="article" />
  <meta
    property="og:title"
    content="{data.note.name || 'Shared Note'} | Nota"
  />
  <meta
    property="og:description"
    content="Read '{data.note.name ||
      'Untitled'}' on Nota, a fast, local-first note-taking and AI workspace."
  />
  <meta property="og:site_name" content="Nota" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<header class="flex items-center relative justify-between w-full p-4">
  <Applogo class="print:hidden" />
  <div class="inline-flex items-center gap-2">
    <Button size="icon" variant="ghost">
      <IconRenderer icon={data.note.icon} />
    </Button>
    <span class="text-lg font-semibold">{data.note.name}</span>
  </div>
  <div class="flex items-center print:hidden gap-2">
    <small class="text-muted-foreground text-sm">{words} Words</small>
    <ToggleMode />
  </div>
</header>

{#if editor}
  <div
    class="relative flex max-h-screen! min-h-screen! w-full! flex-col overflow-hidden! print:overflow-auto!"
  >
    <Edra {editor}>
      <Edra.ToC />
      <Edra.Content
        class="min-w-full overflow-auto w-full cursor-auto px-8 py-4 text-base transition-all duration-300 *:outline-none"
      />
    </Edra>
  </div>
{:else}
  <main class="flex w-full h-full max-w-3xl mx-auto flex-col gap-8">
    <div class="space-y-6 w-full">
      <Skeleton class="h-10 w-3/4 rounded-lg" />
      <div class="space-y-3 w-full">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-[90%]" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-[85%]" />
      </div>
    </div>

    <div class="space-y-6 w-full">
      <Skeleton class="h-8 w-1/2 rounded-lg" />
      <div class="space-y-3 w-full">
        <Skeleton class="h-4 w-[95%]" />
        <Skeleton class="h-4 w-[80%]" />
        <Skeleton class="h-4 w-full" />
      </div>
      <Skeleton class="h-48 w-full mt-4 rounded-xl" />
    </div>

    <div class="space-y-6 w-full">
      <Skeleton class="h-8 w-2/5 rounded-lg" />
      <div class="space-y-3 w-full">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-[88%]" />
      </div>
    </div>
  </main>
{/if}
