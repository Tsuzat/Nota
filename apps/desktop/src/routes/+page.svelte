<script lang="ts">
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import { IconRenderer, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import { Separator } from '@nota/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { cn } from '@nota/ui/utils';
import { ask } from '@tauri-apps/plugin-dialog';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import AppLogoMenu from '$lib/components/app-menu.svelte';
import BackAndForthButtons from '$lib/components/back-and-forth-buttons.svelte';
import { getNewUserWorkspace, useCurrentUserWorkspaceContext } from '$lib/components/user-workspace';
import WindowsButtons from '$lib/components/windows-buttons.svelte';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { getLocalUserWorkspaces, type LocalUserWorkspace } from '$lib/local/userworkspaces.svelte';
import { useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
import { type CloudUserWorkspace, useCloudUserWorkspaces } from '$lib/supabase/db/clouduserworkspaces.svelte';
import { ISMACOS, ISWINDOWS, timeAgo } from '$lib/utils';
const sidebar = useSidebar();
const localUserWorkspaces = getLocalUserWorkspaces();
const cloudUserWorkspaces = useCloudUserWorkspaces();
const currentUserWorkspace = $derived(useCurrentUserWorkspaceContext().getCurrentUserWorkspace());
const localNotes = $derived(getLocalNotes().getNotes());
const cloudNotes = $derived(useCloudNotes().getNotes());

const useNewUserWorkspace = getNewUserWorkspace();
const userWorkspaces: (LocalUserWorkspace | CloudUserWorkspace)[] = $derived.by(() => {
  return [...localUserWorkspaces.getUserWorkspaces(), ...cloudUserWorkspaces.getWorkspaces()];
});

const recentNotes = $derived.by(() => {
  if (currentUserWorkspace === null) return [];
  if ('owner' in currentUserWorkspace) {
    return cloudNotes
      .toSorted((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }
  return localNotes.toSorted((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
});

async function handleDelete(workspace: LocalUserWorkspace | CloudUserWorkspace) {
  if (currentUserWorkspace?.id === workspace.id) {
    return;
  }
  const shouldDelete = await ask(`Are you sure you want to delete the workspace ${workspace.name}?`, {
    title: 'Delete User Workspace',
    okLabel: 'Yes, Delete',
    kind: 'warning',
  });
  if (!shouldDelete) {
    return;
  }
  if ('owner' in workspace) await cloudUserWorkspaces.deleteWorkspace(workspace.id);
  else {
    if (localUserWorkspaces.getUserWorkspaces().length === 1) {
      toast.error('Can not delete last local user workspace', {
        description:
          'You need at least one local user workspace. Create a new local workspace if you want to delete this one.',
      });
      return;
    }
    await localUserWorkspaces.deleteUserWorkspace(workspace.id);
  }
}
</script>

{#if currentUserWorkspace === null}
  <h2>No User Workspace Selected</h2>
{:else}
  <header class="flex h-12 shrink-0 items-center gap-2">
    <div
      class={cn(
        "z-20 ml-18 flex items-center gap-2 px-3",
        ISMACOS && !sidebar.open && "ml-18",
        ISWINDOWS || (sidebar.open && "ml-0")
      )}
    >
      {#if ISWINDOWS && !sidebar.open}
        <AppLogoMenu />
      {/if}
      <SidebarTrigger />
      <BackAndForthButtons />
      <Separator
        orientation="vertical"
        class="mr-2 data-[orientation=vertical]:h-4"
      />
      <h3>{currentUserWorkspace?.name}</h3>
    </div>
    <div class={cn("z-20 ml-auto px-3", ISWINDOWS && "mr-30")}></div>
    {#if ISWINDOWS}
      <WindowsButtons />
    {/if}
  </header>
  <div
    class="mx-auto flex h-[calc(100vh-3rem)] w-full max-w-3xl flex-1 grow flex-col gap-8 overflow-auto"
  >
    <section class="my-2 flex w-full flex-col items-start gap-4 p-2">
      <div class="text-muted-foreground flex w-full items-center gap-2">
        <h4>User Workspaces</h4>
        <span class="text-foreground text-sm">{userWorkspaces.length}</span>
        <SimpleToolTip content="Add New UserWorkspace">
          <Button
            variant="ghost"
            class="size-7 rounded-full"
            onclick={() => (useNewUserWorkspace.open = true)}
          >
            <icons.Plus />
          </Button>
        </SimpleToolTip>
      </div>
      <div class="flex w-full items-center gap-2 overflow-x-auto">
        {#each userWorkspaces as workspace (workspace.id)}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class={buttonVariants({
                variant: "secondary",
                class: cn(
                  "w-fit rounded-lg p-6!",
                  currentUserWorkspace?.id === workspace.id &&
                    "border-primary border"
                ),
              })}
              disabled={currentUserWorkspace?.id === workspace.id}
            >
              <IconRenderer icon={workspace.icon} class="mr-2 size-4" />
              <span class="text-muted-foreground">{workspace.name}</span>
              <icons.ChevronDown class="text-muted-foreground size-2!" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                variant="destructive"
                onclick={() => handleDelete(workspace)}
              >
                <icons.Trash />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/each}
        {#if userWorkspaces.length === 0}
          <span class="text-muted-foreground">No Userworkspaces are found.</span
          >
        {/if}
      </div>
    </section>

    <section class="my-2 flex w-full flex-col items-start gap-4 p-2">
      <h4 class="text-foreground flex items-center gap-2">
        Recents
        <span class="text-muted-foreground text-sm">{recentNotes.length}</span>
      </h4>
      <div
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {#each recentNotes as recent (recent.id)}
          {@const href =
            "owner" in recent
              ? resolve("/(cloud)/note-[id]", { id: String(recent.id) })
              : resolve("/(local)/local-note-[id]", { id: String(recent.id) })}
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
                    <IconRenderer icon={recent.icon} class="size-4" />
                  </div>
                  <Card.Title class="line-clamp-1 text-base font-medium">
                    {recent.name}
                  </Card.Title>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <div class="absolute right-4 bottom-4 left-4">
                <div
                  class="text-muted-foreground flex items-center justify-between text-xs"
                >
                  <div class="flex items-center gap-1">
                    <icons.Clock class="size-3" />
                    {timeAgo(recent.updated_at)}
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
{/if}
