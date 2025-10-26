<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { onMount } from 'svelte';
	import SettingTile from './setting-tile.svelte';
	import { appLocalDataDir } from '@tauri-apps/api/path';
	import { open } from '@tauri-apps/plugin-dialog';

	let defaultLocation = $state<string>('');

	onMount(async () => {
		defaultLocation = await appLocalDataDir();
	});

	async function selectLocation() {
		const locations = await open({
			multiple: false,
			directory: true,
			defaultPath: await appLocalDataDir()
		});
		if (locations) defaultLocation = locations;
	}
</script>

<SettingTile
	title="Default Location"
	description="Default location for your workspaces. You can still changed them when creating the notes"
>
	<Button
		class="w-80 items-start truncate !px-2 text-start"
		variant="outline"
		onclick={selectLocation}>{defaultLocation}</Button
	>
</SettingTile>
