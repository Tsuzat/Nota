<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Trashed from '../dialogs/trashed.svelte';
	import { getGlobalSignInContext } from '../global-signin';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import { auth } from '$lib/supabase';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { toast } from 'svelte-sonner';
	import { useCurrentUserWorkspaceContext } from '../user-workspace/userworkspace.svelte';
	import { useCloudNotes } from '$lib/supabase/db/cloudnotes.svelte';
	import Trash from '$lib/components/icons/moving-icons/trash.svelte';
	import Login from '$lib/components/icons/moving-icons/login.svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { getKeyboardShortcut } from '$lib/utils';
	import { getGlobalSettings } from '../settings';
	import Settings from '$lib/components/icons/moving-icons/settings.svelte';
	import { PUBLIC_NOTA_FRONTEND_URL } from '$env/static/public';

	let isTrashHovered = $state(false);
	let isLoginHovered = $state(false);
	let isSettingsHovered = $state(false);

	const currentUserWorkspace = useCurrentUserWorkspaceContext();
	const trashedNotes = $derived.by(() => {
		if (currentUserWorkspace.getIsLocal())
			return getLocalNotes()
				.getNotes()
				.filter((n) => n.trashed).length;
		else
			return useCloudNotes()
				.getNotes()
				.filter((n) => n.trashed).length;
	});

	let open = $state(false);
	const sidebar = Sidebar.useSidebar();

	const globalSignInContext = getGlobalSignInContext();
	const user = $derived(getSessionAndUserContext().getUser());
	const useSettings = getGlobalSettings();

	function getUserIntials(name?: string) {
		if (!name) return 'U';
		const names = name.split(' ');
		if (names.length > 1) {
			return names[0][0] + names[1][0];
		} else {
			if (names[0].length > 1) {
				return names[0][0] + names[0][1];
			} else {
				return names[0][0];
			}
		}
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
			{#if user === null}
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
			{#if user !== null}
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
										<Avatar.Image src={user?.user_metadata['avatar_url']} alt="User" />
										<Avatar.Fallback class="rounded-lg"
											>{getUserIntials(user.user_metadata['full_name'])}</Avatar.Fallback
										>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium"
											>{user.user_metadata['full_name'] ?? 'Unknown'}</span
										>
										<span class="text-muted-foreground truncate text-xs">
											{user.email}
										</span>
									</div>
									<EllipsisVertical class="ml-auto size-4" />
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
										<Avatar.Image src={user.user_metadata['avatar_url']} alt="User" />
										<Avatar.Fallback class="rounded-lg"
											>{getUserIntials(user.user_metadata['full_name'])}</Avatar.Fallback
										>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium"
											>{user.user_metadata['full_name'] ?? 'Unknown'}</span
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
									<CircleUser />
									Account
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={async () => {
										await openUrl(PUBLIC_NOTA_FRONTEND_URL + '/profile');
									}}
								>
									<CreditCard />
									Billing
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								onclick={() =>
									toast.promise(auth.signOut(), {
										loading: 'Signing you out...',
										success: 'Signed Out Successfully',
										error: (err) => {
											console.error(err);
											return 'Something went wrong.';
										}
									})}
							>
								<LogOut />
								Sign Out
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			{/if}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
