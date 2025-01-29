<script lang="ts">
	import { CHECK_UPDATE_ON_START, SHOW_DECORATION, USER_ICON, USER_NAME } from '$lib/app_settings';
	import IconRender from '$lib/components/icons/icon-render.svelte';
	import Iconpicker from '$lib/components/icons/iconpicker.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { OS, SHOW_SETTINGS } from '$lib/contants';
	import { mode } from 'mode-watcher';
	import Themetoggler from '../themetoggler.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { AppWindow, CheckCircle2, SunMoon, User } from 'lucide-svelte';
</script>

<Dialog.Root bind:open={$SHOW_SETTINGS}>
	<Dialog.Content class="max-w-3xl h-[80vh] p-4 flex flex-col gap-2">
		<h1 class="text-3xl font-bold text-center">Settings</h1>
		<p class="text-xs text-muted-foreground text-center">
			Manage your account settings and preferences.
		</p>
		<div class="mt-4 flex-grow flex flex-col overflow-auto">
			<div id="user" class="setting-tile" title="About the user">
				<div class="left">
					<div class="title">
						<User class="size-4" />
						<span>User</span>
					</div>
					<div class="description">Change the user icon and name as per your liking</div>
				</div>
				<div class="right flex items-center gap-2">
					<Iconpicker onSelect={(icon) => USER_ICON.set(icon)} side="left">
						<IconRender icon={$USER_ICON} />
					</Iconpicker>
					<input
						type="text"
						placeholder="Username"
						bind:value={$USER_NAME}
						class="w-full bg-background text-ellipsis hover:bg-muted focus:bg-muted/40 p-1 rounded-sm focus:outline-none"
					/>
				</div>
			</div>
			<div id="user" class="setting-tile" title="Window Preferences">
				<div class="left">
					<div class="title">
						<SunMoon class="size-4" />
						<span>Theme</span>
					</div>
					<div class="description">Choose from light, dark and system</div>
				</div>
				<div class="right flex items-center gap-2">
					<Themetoggler />
					<span class="capitalize p-1">{$mode || 'system'}</span>
				</div>
			</div>
			{#if OS === 'windows'}
				<div id="user" class="setting-tile" title="Window Preferences">
					<div class="left">
						<div class="title">
							<AppWindow class="size-4" />
							<span>Show Decoration</span>
						</div>
						<div class="description">Show or hide the window decoration</div>
					</div>
					<div class="right flex items-center gap-2">
						<Switch bind:checked={$SHOW_DECORATION} />
						<span class="p-1">{$SHOW_DECORATION ? 'Decoration on' : 'Decoration off'}</span>
					</div>
				</div>
			{/if}
			<div id="user" class="setting-tile" title="Window Preferences">
				<div class="left">
					<div class="title">
						<CheckCircle2 class="size-4" />
						<span>Check Update on start</span>
					</div>
					<div class="description">Weather to check for update on app start or not</div>
				</div>
				<div class="right flex items-center gap-2">
					<Switch bind:checked={$CHECK_UPDATE_ON_START} />
					<span class="p-1"
						>{$CHECK_UPDATE_ON_START ? 'Update Check is on' : 'Update Check is off'}</span
					>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.setting-tile {
		@apply flex items-center w-full border-b border-muted/50 p-2;
	}
	.setting-tile .left {
		@apply mr-4 w-[50%];
	}

	.setting-tile .left .title {
		@apply flex items-center gap-2;
	}

	.setting-tile .left .description {
		@apply text-sm text-muted-foreground text-wrap;
	}

	.setting-tile .right {
		@apply ml-4 w-[50%];
	}
</style>
