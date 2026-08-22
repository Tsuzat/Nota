<script lang="ts">
import { ChevronRight } from "@lucide/svelte";
import * as Collapsible from "@nota/ui/shadcn/collapsible/index.ts";
import * as Sidebar from "@nota/ui/shadcn/sidebar/index.ts";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import NoteTile from "./note-tile.svelte";

const notesCtx = getNotesContext();
const notes = $derived(notesCtx.collaborated);
</script>

{#if notes.length > 0}
  <Collapsible.Root open={true} class="group/collapsible">
    <Sidebar.Group>
      <Sidebar.GroupLabel class="justify-between">
        <span>Shared With Me</span>
        <Collapsible.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              class="flex size-5 items-center justify-center rounded-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ChevronRight
                class="size-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90"
              />
            </button>
          {/snippet}
        </Collapsible.Trigger>
      </Sidebar.GroupLabel>
      <Collapsible.Content>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#if notes.length > 0}
              {#each notes as note (note.id)}
                <NoteTile {note} />
              {/each}
            {:else}
              <div
                class="text-xs text-sidebar-foreground/50 px-3 py-4 text-center select-none font-medium"
              >
                No shared notes
              </div>
            {/if}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Collapsible.Content>
    </Sidebar.Group>
  </Collapsible.Root>
{/if}
