<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import Sparkle from '@lucide/svelte/icons/sparkle';
	import { getGlobalSettings } from './constants.svelte';
	import ToggleMode from '../toggle-mode.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { getSessionAndUserContext } from '$lib/supabase/user.svelte';

	const useSettings = getGlobalSettings();
	const useSessionAndUser = getSessionAndUserContext();

	let disableAIToggle = $derived.by(() => {
		return useSessionAndUser.getSession() === null && useSessionAndUser.getUser() === null;
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			useSettings.open = !useSettings.open;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Dialog.Root bind:open={useSettings.open}>
	<Dialog.Trigger class="sr-only">Open</Dialog.Trigger>
	<Dialog.Content
		class="mx-auto flex min-h-[80vh] min-w-[50vw] flex-col gap-4"
		portalProps={{ disabled: true, to: undefined }}
		showCloseButton={false}
	>
		<h3>Settings</h3>
		<div id="user" class="setting-tile" title="Window Preferences">
			<div class="left">
				<div class="title">
					<SunMoon class="size-4" />
					<span>Theme</span>
				</div>
				<div class="description">Toggle theme between light and dark</div>
			</div>
			<div class="right flex items-center gap-2">
				<ToggleMode />
			</div>
		</div>
		<div id="user" class="setting-tile" title="Window Preferences">
			<div class="left">
				<div class="title">
					<Sparkle class="size-4" />
					<span>Use AI</span>
				</div>
				<div class="description">Pro members can use AI in Notes. You need to be logged in.</div>
			</div>
			<div class="right flex items-center gap-2">
				<Switch bind:checked={useSettings.useAI} disabled={disableAIToggle} />
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.setting-tile {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background-color: var(--background-secondary);
		border: 1px solid var(--border-color);
		margin-bottom: 0.5rem;
	}

	.setting-tile .left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-tile .left .title {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.setting-tile .left .description {
		color: var(--color-muted-foreground);
	}

	.setting-tile .right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
