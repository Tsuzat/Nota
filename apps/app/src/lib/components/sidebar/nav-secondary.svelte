<script lang="ts">
import CircleUser from "@lucide/svelte/icons/circle-user";
import LogOut from "@lucide/svelte/icons/log-out";
import Moon from "@lucide/svelte/icons/moon-star";
import Sun from "@lucide/svelte/icons/sun";
import { SimpleToolTip, toggleMode } from "@nota/ui";
import {
	MovingLogin,
	MovingSettings,
	MovingTrash,
} from "@nota/ui/icons/index.js";
import * as Avatar from "@nota/ui/shadcn/avatar/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as DropdownMenu from "@nota/ui/shadcn/dropdown-menu/index.ts";
import * as Sidebar from "@nota/ui/shadcn/sidebar/index.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import { authClient } from "#lib/auth-client.ts";
import { getAuthSession, isSignedIn } from "#lib/auth-session.svelte.ts";
import { openTrash } from "#lib/components/dialogs/transhed.svelte";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import { getKeyboardShortcut } from "#lib/utils.ts";
import { setCorrectWindowMode } from "#lib/window.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";
import { getGlobalSettings, openSigninDevice } from "../dialogs";

let isTrashHovered = $state(false);
let isLoginHovered = $state(false);
let isSettingsHovered = $state(false);
const notesCtx = getNotesContext();

const trashedNotes = $derived.by(() => {
	return notesCtx.list.filter((note) => note.trashedAt).length;
});

const sidebar = Sidebar.useSidebar();

const session = getAuthSession();
// const globalSignInContext = getGlobalSignInContext();
const useSettings = getGlobalSettings();

function getUserIntials(name?: string) {
	if (!name) return "U";
	const names = name.split(" ");
	if (names.length > 1) {
		return names[0][0] + names[1][0];
	}
	if (names[0].length > 1) {
		return names[0][0] + names[0][1];
	}
	return names[0][0];
}
</script>

<Sidebar.Group class="mt-auto">
  <Sidebar.GroupContent>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <div class="flex items-center justify-around w-full">
          <SimpleToolTip content="Toggle Theme">
            <Button
              variant="outline"
              size="icon-lg"
              class="relative"
              onclick={() => {
                toggleMode();
                setCorrectWindowMode();
              }}
            >
              <Sun class="dark:hidden" />
              <Moon class="hidden dark:block" />
            </Button>
          </SimpleToolTip>
          <SimpleToolTip
            content="Settings"
            keyboard={getKeyboardShortcut(",", true)}
            side="bottom"
          >
            <Button
              variant="outline"
              size="icon-lg"
              onclick={() => {
                useSettings.open = true;
              }}
              onmouseenter={() => (isSettingsHovered = true)}
              onmouseleave={() => (isSettingsHovered = false)}
            >
              <MovingSettings size={18} isHovered={isSettingsHovered} />
            </Button>
          </SimpleToolTip>
          <SimpleToolTip content="Trash">
            <Button
              variant="outline"
              size="icon-lg"
              class="relative"
              onclick={openTrash}
              onmouseenter={() => (isTrashHovered = true)}
              onmouseleave={() => (isTrashHovered = false)}
            >
              <MovingTrash size={18} isHovered={isTrashHovered} />
              {#if trashedNotes}
                <span
                  class="absolute -top-2 text-xs -right-2 bg-primary text-background rounded-full size-4"
                  >{trashedNotes}</span
                >
              {/if}
            </Button>
          </SimpleToolTip>

          {#if !isSignedIn()}
            <SimpleToolTip content="Sign In">
              <Button
                variant="outline"
                size="icon-lg"
                onclick={openSigninDevice}
                onmouseenter={() => (isLoginHovered = true)}
                onmouseleave={() => (isLoginHovered = false)}
              >
                <MovingLogin size={18} isHovered={isLoginHovered} />
              </Button>
            </SimpleToolTip>
          {:else if session.data?.user}
            {@const user = session.data.user}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="icon-lg"
                    class="p-0! rounded-full overflow-hidden data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar.Root class="size-full">
                      <Avatar.Image src={user.image} alt="User" />
                      <Avatar.Fallback class="rounded-lg bg-transparent"
                        >{getUserIntials(user.name)}</Avatar.Fallback
                      >
                    </Avatar.Root>
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                class="min-w-56 rounded-lg"
                side={sidebar.isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenu.Label class="p-0 font-normal">
                  <div
                    class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                  >
                    <Avatar.Root class="size-8 rounded-lg">
                      <Avatar.Image src={user.image} alt="User" />
                      <Avatar.Fallback class="rounded-lg"
                        >{getUserIntials(user.name)}</Avatar.Fallback
                      >
                    </Avatar.Root>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-medium"
                        >{user.name ?? "Unknown"}</span
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
                    onclick={async () => {
                      await openUrl(PUBLIC_NOTA_URL + "/account");
                    }}
                  >
                    <CircleUser />
                    Account
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  variant="destructive"
                  onclick={() => {
                    authClient.signOut();
                  }}
                >
                  <LogOut />
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          {/if}
        </div>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.GroupContent>
</Sidebar.Group>
