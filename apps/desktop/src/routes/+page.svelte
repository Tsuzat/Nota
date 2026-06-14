<script lang="ts">
import { getNotesContext } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import * as Card from '@nota/ui/shadcn/card';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import Topbar from '$lib/components/topbar.svelte';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { timeAgo } from '$lib/utils';

const localNotes = $derived(getLocalNotes().getNotes());
const cloudNotes = $derived(getNotesContext().notes);

const recentNotes = $derived.by(() => {
  const allNotes = [...localNotes, ...cloudNotes];
  return allNotes
    .toSorted((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
    .slice(0, 10);
});

</script>

<Topbar showSeparator={true}>
  <h3 class="text-lg font-semibold">Dashboard</h3>
</Topbar>
<div
  class="mx-auto flex h-[calc(100vh-3rem)] w-full max-w-3xl flex-1 grow flex-col gap-8 overflow-auto"
>
  <section class="my-2 flex w-full flex-col items-start gap-4 p-2">
    <h4 class="text-foreground flex items-center gap-2">
      Recents
      <span class="text-muted-foreground text-sm">{recentNotes.length}</span>
    </h4>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each recentNotes as recent (recent.id)}
        {@const href =
          'owner' in recent
            ? resolve('/(cloud)/note-[id]', { id: String(recent.id) })
            : resolve('/(local)/local-note-[id]', { id: String(recent.id) })}
        <Card.Root
          onclick={() => goto(href)}
          class="hover:bg-accent group relative flex h-40 w-48 cursor-pointer flex-col justify-between overflow-hidden transition-all hover:shadow-md"
        >
          <Card.Header class="pb-2">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <div
                  class="bg-secondary/50 flex size-8 shrink-0 items-center justify-center rounded-md"
                >
                  <IconRenderer icon={recent.icon ?? "lucide:File"} class="size-4" />
                </div>
                <Card.Title class="line-clamp-1 text-base font-medium">
                  {recent.name}
                </Card.Title>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <div class="absolute right-4 bottom-4 left-4">
              <div class="text-muted-foreground flex items-center justify-between text-xs">
                <div class="flex items-center gap-1">
                  <icons.Clock class="size-3" />
                  {"owner" in recent ? timeAgo(recent.updated_at?.toString() ?? ""): timeAgo(recent.updated_at)}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
      {#if recentNotes.length === 0}
        <span class="text-muted-foreground">No recent notes are found.</span>
      {/if}
    </div>
  </section>
</div>
