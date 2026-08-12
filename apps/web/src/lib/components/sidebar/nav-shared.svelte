<script lang="ts">
import { Button } from '@lib/components/ui/button';
import { getNotesContext } from '@nota/client';
import { icons } from '@nota/ui/icons/index.js';
import * as Collapsible from '@nota/ui/shadcn/collapsible';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import NoteTile from './note-tile.svelte';

const cloudNotes = getNotesContext();
const sharedNotes = $derived(cloudNotes.sharedNotes);
let open = $state(true);
</script>

{#if sharedNotes.length > 0}
  <Collapsible.Root bind:open class="group/collapsible">
    <Sidebar.Group>
      <Sidebar.GroupLabel class="justify-between">
        <span>Shared with me</span>
        <Collapsible.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="icon-xs">
              <icons.ChevronRight
                class="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90"
              />
            </Button>
          {/snippet}
        </Collapsible.Trigger>
      </Sidebar.GroupLabel>
      <Collapsible.Content>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each sharedNotes as note (note.id)}
              <NoteTile {note} />
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Collapsible.Content>
    </Sidebar.Group>
  </Collapsible.Root>
{/if}
