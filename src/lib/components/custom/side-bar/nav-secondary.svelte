<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import {
		CreditCard,
		Download,
		EllipsisVertical,
		LogIn,
		LogOut,
		Trash2,
		UserCircle
	} from '@lucide/svelte';
	import Trashed from '../dialogs/trashed.svelte';
	import { downloadAndInstall } from '$lib/updater';
	import { check } from '@tauri-apps/plugin-updater';
	import { getGlobalSignInContext } from '../global-signin';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';
	import { auth } from '$lib/supabase';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { toast } from 'svelte-sonner';

	const trashedNotes = $derived(
		getLocalNotes()
			.getNotes()
			.filter((n) => n.trashed).length
	);

	let open = $state(false);
	const sidebar = Sidebar.useSidebar();

	const globalSignInContext = getGlobalSignInContext();
	const user = $derived(getSessionAndUserContext().getUser());

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
			<!-- <Sidebar.MenuItem>
				<Sidebar.MenuButton class="group/settings" onclick={() => (useSettings.open = true)}>
					<Settings
						class="rotate-0 transition-transform duration-700 group-hover/settings:rotate-180"
					/>
					<span>Settings</span>
				</Sidebar.MenuButton>
				<Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded-md p-1.5">
					{getKeyboardShortcut(',', true)}
				</Sidebar.MenuBadge>
			</Sidebar.MenuItem> -->
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="group/trash" onclick={() => (open = true)}>
					<Trash2 class="group-hover/trash:animate-bounce" />
					<span>Trash</span>
				</Sidebar.MenuButton>
				<Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded-full p-1.5">
					{trashedNotes}
				</Sidebar.MenuBadge>
				<Trashed bind:open />
			</Sidebar.MenuItem>
			{#await check() then update}
				{#if update !== null && update !== undefined}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton onclick={() => downloadAndInstall(update)}>
							<Download />
							<span>Click to Update</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}
			{/await}
			{#if user === null}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={() => (globalSignInContext.open = true)}>
						<LogIn />
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
								<DropdownMenu.Item>
									<UserCircle />
									Account
								</DropdownMenu.Item>
								<DropdownMenu.Item>
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
