<script lang="ts">
import { icons } from '@nota/ui/icons/index.js';
import Login from '@nota/ui/icons/moving-icons/login.svelte';
import Settings from '@nota/ui/icons/moving-icons/settings.svelte';
import Trash from '@nota/ui/icons/moving-icons/trash.svelte';
import * as Avatar from '@nota/ui/shadcn/avatar';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import { toast } from '@nota/ui/shadcn/sonner';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';
import { getLocalNotes } from '$lib/local/notes.svelte';
import { getKeyboardShortcut } from '$lib/utils';
import Trashed from '../dialogs/trashed.svelte';
import { getGlobalSignInContext } from '../global-signin';
import { getGlobalSettings } from '../settings';
import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
import { getAuthContext, getNotesContext } from '@nota/client';

let isTrashHovered = $state(false);
let isLoginHovered = $state(false);
let isSettingsHovered = $state(false);

const currentUserWorkspace = useCurrentUserWorkspaceContext();
const trashedNotes = $derived.by(() => {
  if (currentUserWorkspace.getIsLocal())
    return getLocalNotes()
      .getNotes()
      .filter((n) => n.trashed).length;

  return getNotesContext().notes.filter((n) => n.trashed).length;
});

let open = $state(false);
const sidebar = Sidebar.useSidebar();

const auth = getAuthContext();
const globalSignInContext = getGlobalSignInContext();
const user = $derived(auth.user);
const useSettings = getGlobalSettings();

function getUserIntials(name?: string) {
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
</script>

<Sidebar.Group class="mt-auto">
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					onclick={() => (useSettings.open = !useSettings.open)}
					onmouseenter={() => (isSettingsHovered = true)}
					onmouseleave={() => (isSettingsHovered = false)}
				>
					<Settings size={18} isHovered={isSettingsHovered} />
					<span>Settings</span>
				</Sidebar.MenuButton>
				<Sidebar.MenuBadge class="bg-muted text-primary! rounded-md p-1.5">
					{getKeyboardShortcut(',', true)}
				</Sidebar.MenuBadge>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					onclick={() => (open = true)}
					onmouseenter={() => (isTrashHovered = true)}
					onmouseleave={() => (isTrashHovered = false)}
				>
					<Trash size={18} isHovered={isTrashHovered} />
					<span>Trash</span>
				</Sidebar.MenuButton>
				<Sidebar.MenuBadge class="bg-muted text-primary! rounded-full p-1.5">
					{trashedNotes}
				</Sidebar.MenuBadge>
				<Trashed bind:open />
			</Sidebar.MenuItem>
			{#if !user}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						onclick={() => (globalSignInContext.open = true)}
						onmouseenter={() => (isLoginHovered = true)}
						onmouseleave={() => (isLoginHovered = false)}
					>
						<Login size={18} isHovered={isLoginHovered} />
						Sign In
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
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
										<Avatar.Image src={user.avatarUrl} alt="User" />
										<Avatar.Fallback class="rounded-lg"
											>{getUserIntials(user.name || "Unknown")}</Avatar.Fallback
										>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium"
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
										<Avatar.Image src={user.avatarUrl} alt="User" />
										<Avatar.Fallback class="rounded-lg"
											>{getUserIntials(user.name || "Unknown")}</Avatar.Fallback
										>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
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
									onclick={async () => {
										await openUrl(PUBLIC_NOTA_FRONTEND_URL + '/profile');
									}}
								>
									<icons.CircleUser />
									Account
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={async () => {
										await openUrl(PUBLIC_NOTA_FRONTEND_URL + '/profile');
									}}
								>
									<icons.CreditCard />
									Billing
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								onclick={() =>
									toast.promise(auth.logout(), {
										loading: 'Signing you out...',
										success: 'Signed Out Successfully',
										error: (err) => {
											console.error(err);
											return 'Something went wrong.';
										}
									})}
							>
								<icons.LogOut />
								Sign Out
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			{/if}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
