<script lang="ts">
import { getAuthContext, getNotesContext } from '@nota/client';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import { Separator } from '@nota/ui/shadcn/separator';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { openNewNote } from '$lib/components/dialogs';
import { getGlobalSearch } from '$lib/components/global-search';
import { getGlobalSettings } from '$lib/components/settings';
import Topbar from '$lib/components/topbar.svelte';
import { getCurrentWorkspace } from '$lib/currentworkspace.svelte';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { getKeyboardShortcut, timeAgo } from '$lib/utils';

const localNotes = $derived(getLocalNotes().getNotes());
const cloudNotes = $derived(getNotesContext().notes);
const auth = getAuthContext();
const user = $derived(auth.user);
const workspace = $derived(getCurrentWorkspace().get());
const search = getGlobalSearch();
const settings = getGlobalSettings();

// Recent notes: merged & sorted by updated_at (top 12)
const recentNotes = $derived.by(() => {
  const allNotes = [...localNotes, ...cloudNotes].filter((n) => !('deleted_at' in n && n.deleted_at));
  return allNotes
    .toSorted((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
    .slice(0, 12);
});

// Pinned notes
const pinnedNotes = $derived.by(() => {
  const allNotes = [...localNotes, ...cloudNotes].filter((n) => n.pinned && !('deleted_at' in n && n.deleted_at));
  return allNotes.toSorted((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
});

// Total notes count (non-deleted)
const totalNotes = $derived([...localNotes, ...cloudNotes].filter((n) => !('deleted_at' in n && n.deleted_at)).length);

// Dynamic greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function isCloudNote(note: (typeof recentNotes)[number]): boolean {
  return 'owner' in note;
}

function getNoteHref(note: (typeof recentNotes)[number]): string {
  if ('owner' in note) {
    return resolve('/(cloud)/note-[id]', { id: String(note.id) });
  }
  return resolve('/(local)/local-note-[id]', { id: String(note.id) });
}
</script>

<Topbar showSeparator={true}>
  <h3 class="text-lg font-semibold">Home</h3>
</Topbar>

<div
  class="flex h-[calc(100vh-3rem)] w-full flex-1 grow overflow-auto"
>
<div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-4">
  <section class="flex flex-col gap-1">
    <h2
      class="text-foreground scroll-m-0 pb-0 text-2xl font-semibold tracking-tight"
    >
      {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
    </h2>
    <p class="text-muted-foreground text-sm">
      {#if workspace}
        Working in <span class="text-foreground font-medium"
          >{workspace.name}</span
        >
        ·
      {/if}
      {totalNotes}
      {totalNotes === 1 ? 'note' : 'notes'} total
    </p>
  </section>

  <section class="flex flex-wrap items-center gap-2">
    <Button
      variant="outline"
      class="gap-2"
      onclick={() => openNewNote()}
    >
      <icons.Plus class="size-4" />
      New Note
    </Button>
    <Button
      variant="outline"
      class="gap-2"
      onclick={() => (search.open = true)}
    >
      <icons.Search class="size-4" />
      Search
      <kbd
        class="bg-muted text-muted-foreground pointer-events-none ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      >
        {getKeyboardShortcut('K', true)}
      </kbd>
    </Button>
    <Button
      variant="outline"
      class="gap-2"
      onclick={() => (settings.open = true)}
    >
      <icons.Settings class="size-4" />
      Settings
      <kbd
        class="bg-muted text-muted-foreground pointer-events-none ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      >
        {getKeyboardShortcut(',', true)}
      </kbd>
    </Button>
  </section>

  <Separator />

  {#if pinnedNotes.length > 0}
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <icons.Pin class="text-muted-foreground size-4" />
        <h4
          class="text-foreground scroll-m-0 text-base font-semibold tracking-tight"
        >
          Pinned
        </h4>
        <span
          class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
        >
          {pinnedNotes.length}
        </span>
      </div>
      <div
        class="flex gap-3 overflow-x-auto pb-1"
        style="scrollbar-width: none;"
      >
        {#each pinnedNotes as note (note.id)}
          {@const href = getNoteHref(note)}
          <Card.Root
            onclick={() => goto(href)}
            class="hover:bg-accent group relative flex h-28 w-52 min-w-52 cursor-pointer flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <Card.Header class="pb-1">
              <div class="flex items-center gap-2">
                <div
                  class="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-md"
                >
                  <IconRenderer
                    icon={note.icon ?? 'lucide:File'}
                    class="size-3.5"
                  />
                </div>
                <Card.Title class="line-clamp-1 text-sm font-medium">
                  {note.name}
                </Card.Title>
              </div>
            </Card.Header>
            <Card.Content class="pt-0">
              <div class="flex items-center justify-between">
                <div
                  class="text-muted-foreground flex items-center gap-1 text-[11px]"
                >
                  <icons.Clock class="size-3" />
                  {'owner' in note
                    ? timeAgo(note.updated_at?.toString() ?? '')
                    : timeAgo(note.updated_at)}
                </div>
                <div class="text-muted-foreground/60">
                  {#if isCloudNote(note)}
                    <icons.Cloud class="size-3" />
                  {:else}
                    <icons.HardDrive class="size-3" />
                  {/if}
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </section>

    <Separator />
  {/if}

  <section class="flex flex-col gap-3 pb-6">
    <div class="flex items-center gap-2">
      <icons.Clock class="text-muted-foreground size-4" />
      <h4
        class="text-foreground scroll-m-0 text-base font-semibold tracking-tight"
      >
        Recents
      </h4>
      <span
        class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
      >
        {recentNotes.length}
      </span>
    </div>

    {#if recentNotes.length > 0}
      <div
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {#each recentNotes as note (note.id)}
          {@const href = getNoteHref(note)}
          <Card.Root
            onclick={() => goto(href)}
            class="hover:bg-accent group relative flex h-44 cursor-pointer flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <Card.Header class="pb-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div
                    class="bg-secondary/60 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 group-hover:bg-primary/10"
                  >
                    <IconRenderer
                      icon={note.icon ?? 'lucide:File'}
                      class="size-4"
                    />
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <Card.Title class="line-clamp-1 text-sm font-medium">
                      {note.name}
                    </Card.Title>
                    {#if note.pinned}
                      <div
                        class="text-primary flex items-center gap-1 text-[10px] font-medium"
                      >
                        <icons.Pin class="size-2.5" />
                        Pinned
                      </div>
                    {/if}
                  </div>
                </div>
                <div
                  class="text-muted-foreground/50 mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  {#if isCloudNote(note)}
                    <icons.Cloud class="size-3.5" />
                  {:else}
                    <icons.HardDrive class="size-3.5" />
                  {/if}
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div class="absolute right-4 bottom-4 left-4">
                <div
                  class="text-muted-foreground flex items-center justify-between text-xs"
                >
                  <div class="flex items-center gap-1.5">
                    <icons.Clock class="size-3" />
                    {'owner' in note
                      ? timeAgo(note.updated_at?.toString() ?? '')
                      : timeAgo(note.updated_at)}
                  </div>
                  <span
                    class="bg-muted rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    {isCloudNote(note) ? 'Cloud' : 'Local'}
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {:else}
    
      <div
        class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16"
      >
        <div
          class="bg-muted flex size-16 items-center justify-center rounded-2xl"
        >
          <icons.NotebookPen class="text-muted-foreground size-8" />
        </div>
        <div class="flex flex-col items-center gap-1.5 text-center">
          <h4
            class="text-foreground scroll-m-0 text-lg font-semibold tracking-tight"
          >
            No notes yet
          </h4>
          <p class="text-muted-foreground max-w-xs text-sm">
            Start capturing your ideas. Create your first note and let your
            thoughts flow.
          </p>
        </div>
        <Button class="mt-2 gap-2" onclick={() => openNewNote()}>
          <icons.Plus class="size-4" />
          Create Your First Note
        </Button>
      </div>
    {/if}
  </section>
</div>
</div>
