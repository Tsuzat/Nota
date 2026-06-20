<script lang="ts">
import { getAuthContext, getNotesContext } from '@nota/client';
import { icons, MovingSettings, MovingTrash } from '@nota/ui/icons/index.js';
import * as Avatar from '@nota/ui/shadcn/avatar';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import Trashed from '../dialogs/trashed.svelte';

let isTrashHovered = $state(false);
let isSettingsHovered = $state(false);
let openTrash = $state(false);

const cloudNotes = getNotesContext();
const trashedNotesCount = $derived(cloudNotes.notes.filter((n) => n.deleted_at).length);

const auth = getAuthContext();
const user = $derived(auth.user);
const sidebar = Sidebar.useSidebar();

function getUserInitials(name?: string) {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[1][0];
  }
  if (names[0].length > 1) {
    return names[0][0] + names[0][1];
  }
  return names[0][0];
}

async function handleLogout() {
  toast.promise(auth.logout(), {
    loading: 'Signing you out...',
    success: () => {
      goto(resolve('/signin'));
      return 'Signed Out Successfully';
    },
    error: (err) => {
      console.error(err);
      return 'Something went wrong.';
    },
  });
}
</script>

<Sidebar.Group class="mt-auto">
  <Sidebar.GroupContent>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          onclick={() => goto(resolve('/profile'))}
          onmouseenter={() => (isSettingsHovered = true)}
          onmouseleave={() => (isSettingsHovered = false)}
        >
          <MovingSettings size={18} isHovered={isSettingsHovered} />
          <span>Profile & Settings</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>

      <Sidebar.MenuItem class="relative">
        <Sidebar.MenuButton
          onclick={() => (openTrash = !openTrash)}
          onmouseenter={() => (isTrashHovered = true)}
          onmouseleave={() => (isTrashHovered = false)}
        >
          <MovingTrash size={18} isHovered={isTrashHovered} />
          <span>Trash</span>
        </Sidebar.MenuButton>
        <Sidebar.MenuBadge class="bg-muted text-primary rounded-full p-1.5 absolute right-2">
          {trashedNotesCount}
        </Sidebar.MenuBadge>
        <Trashed bind:open={openTrash} />
      </Sidebar.MenuItem>

      {#if user}
        <Sidebar.MenuItem>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuButton
                  {...props}
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar.Root class="size-8 rounded-lg">
                    <Avatar.Image src={user.avatar_url} alt="User" />
                    <Avatar.Fallback class="rounded-lg"
                      >{getUserInitials(user.name || "Unknown")}</Avatar.Fallback
                    >
                  </Avatar.Root>
                  <div class="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span class="truncate font-medium text-sidebar-foreground"
                      >{user.name ?? 'Unknown'}</span
                    >
                    <span class="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                  <icons.EllipsisVertical class="ml-auto size-4" />
                </Sidebar.MenuButton>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
              side={sidebar.isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenu.Label class="p-0 font-normal">
                <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar.Root class="size-8 rounded-lg">
                    <Avatar.Image src={user.avatar_url} alt="User" />
                    <Avatar.Fallback class="rounded-lg"
                      >{getUserInitials(user.name || "Unknown")}</Avatar.Fallback
                    >
                  </Avatar.Root>
                  <div class="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span class="truncate font-medium"
                      >{user.name ?? 'Unknown'}</span
                    >
                    <span class="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenu.Label>
              <DropdownMenu.Separator />
              <DropdownMenu.Group>
                <DropdownMenu.Item
                  onclick={() => goto(resolve('/profile'))}
                >
                  <icons.CircleUser class="size-4" />
                  Account Profile
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onclick={() => goto(resolve('/profile'))}
                >
                  <icons.CreditCard class="size-4" />
                  Billing & Subscriptions
                </DropdownMenu.Item>
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onclick={handleLogout}
              >
                <icons.LogOut class="size-4" />
                Sign Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Sidebar.MenuItem>
      {/if}
    </Sidebar.Menu>
  </Sidebar.GroupContent>
</Sidebar.Group>
