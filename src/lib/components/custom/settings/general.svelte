<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { mode, resetMode, setMode } from 'mode-watcher';
	import SettingTile from './setting-tile.svelte';
	let appearance = $derived.by(() => {
		if (mode.current === 'light') return 'Light';
		if (mode.current === 'dark') return 'Dark';
		return 'System';
	});
</script>

<SettingTile title="Appearance" description="Select the appearance of your application">
	<Select.Root type="single" value={appearance}>
		<Select.Trigger>{appearance}</Select.Trigger>
		<Select.Content>
			<Select.Item value="light" onclick={() => setMode('light')}>Light</Select.Item>
			<Select.Item value="dark" onclick={() => setMode('dark')}>Dark</Select.Item>
			<Select.Item value="system" onclick={resetMode}>System</Select.Item>
		</Select.Content>
	</Select.Root>
</SettingTile>
