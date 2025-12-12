<script lang="ts">
import { themes, setTheme } from '$lib/theme';
import ToggleMode from '@nota/ui/custom/ToggleMode.svelte';
import { icons } from '@nota/ui/icons/index.js';
import { getGlobalSettings } from '../constants.svelte';

const globalSettings = getGlobalSettings();

function handleThemeChange(themeName: string) {
  globalSettings.themeColor = themeName;
  setTheme(themeName);
}
</script>

<div class="mx-auto w-120 space-y-6 p-6">
	<div>
		<h3 class="text-lg font-medium">Appearance</h3>
		<p class="text-muted-foreground text-sm">Customize the look and feel of the application.</p>
	</div>
	<div class="space-y-4">
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<h4 class="font-medium">Toggle Theme</h4>
				<p class="text-muted-foreground text-xs">Switch between light and dark mode.</p>
			</div>
			<ToggleMode />
		</div>
		<div class="rounded-lg border p-4">
			<h4 class="font-medium">Theme</h4>
			<p class="text-muted-foreground text-xs">Select a primary color for the application.</p>
			<div class="mt-4 grid grid-cols-4 gap-4">
				{#each themes as theme (theme.name)}
					<button
						class="flex flex-col items-center space-y-2"
						onclick={() => handleThemeChange(theme.name)}
					>
						<div
							class="flex size-8 items-center justify-center rounded-full border-2"
							style:background-color={theme.color.light}
						>
							{#if globalSettings.themeColor === theme.name}
								<icons.Check class="size-4" />
							{/if}
						</div>
						<span class="text-xs">{theme.label}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
