<script lang="ts">
  import { SimpleToolTip } from "@nota/ui/custom/index.js";
  import { IconRenderer, icons } from "@nota/ui/icons/index.js";
  import { Button, buttonVariants } from "@nota/ui/shadcn/button";
  import * as Collapsible from "@nota/ui/shadcn/collapsible";
  import * as Sidebar from "@nota/ui/shadcn/sidebar";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getLocalNotes } from "$lib/local/notes.svelte";
  import { getLocalWorkspaces } from "$lib/local/workspaces.svelte";
  import { getKeyboardShortcut } from "$lib/utils";
  import NewWorkspace from "../dialogs/new-workspace.svelte";
  import RecursiveLocalNote from "./recursive-local-note.svelte";
  import { openNewNote } from "../dialogs";

  let showMore = $state(false);

  const localWorkspaces = getLocalWorkspaces();
  const workspaces = $derived(
    localWorkspaces.getWorkspaces().slice(0, showMore ? undefined : 5),
  );
  const localNotes = getLocalNotes();

  let open = $state(false);
</script>

<NewWorkspace bind:open />

<Sidebar.Group>
  <Sidebar.GroupLabel class="justify-between">
    Local Workspaces
    <SimpleToolTip>
      <Button variant="ghost" class="size-6" onclick={() => (open = true)}>
        <icons.Plus />
      </Button>
      {#snippet child()}
        <div class="inline-flex items-center gap-1">
          <span>Create Workspace</span>
          <span class="bg-muted text-primary rounded p-0.5"
            >{getKeyboardShortcut("N", true)}</span
          >
        </div>
      {/snippet}
    </SimpleToolTip>
  </Sidebar.GroupLabel>
  <Sidebar.GroupContent>
    {#if workspaces.length > 0}
      <Sidebar.Menu>
        {#each workspaces as workspace (workspace.id)}
          <Collapsible.Root>
            {@const href = resolve("/(local)/local-workspace-[id]", {
              id: workspace.id,
            })}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton onclick={() => goto(href)}>
                {#snippet child({ props })}
                  <span {...props}>
                    <IconRenderer icon={workspace.icon} />
                    <span class="cursor-default">{workspace.name}</span>
                  </span>
                {/snippet}
              </Sidebar.MenuButton>
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuAction
                    {...props}
                    class="bg-sidebar-accent size-6! text-sidebar-accent-foreground left-1.5 data-[state=open]:rotate-90"
                    showOnHover
                  >
                    <icons.ChevronRight />
                  </Sidebar.MenuAction>
                {/snippet}
              </Collapsible.Trigger>
              <Sidebar.MenuAction
                showOnHover
                onclick={() => openNewNote(workspace)}
                class={buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                  class: "top-0.5!",
                })}
              >
                <icons.Plus />
              </Sidebar.MenuAction>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {@const notes = localNotes
                    .getNotes()
                    .filter(
                      (n) =>
                        n.workspace_id === workspace.id &&
                        !n.parent_note_id &&
                        !n.deleted_at,
                    )}
                  {#each notes as note (note.id)}
                    <RecursiveLocalNote {note} {workspace} />
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Sidebar.MenuItem>
          </Collapsible.Root>
        {/each}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            class="text-sidebar-foreground/70"
            onclick={() => (showMore = !showMore)}
          >
            <icons.Ellipsis />
            <span>{showMore ? "Less" : "More"}</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    {:else}
      <Sidebar.Menu>
        <Sidebar.MenuItem class="flex items-center gap-2">
          <Sidebar.MenuButton
            class="text-sidebar-foreground/70"
            onclick={() => (open = true)}
          >
            <icons.Plus />
            <span>Add Workspace</span>
            <Sidebar.MenuBadge
              class="bg-muted text-muted-foreground rounded p-1"
            >
              {getKeyboardShortcut("N", true)}
            </Sidebar.MenuBadge>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    {/if}
  </Sidebar.GroupContent>
</Sidebar.Group>
