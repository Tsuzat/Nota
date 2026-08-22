<script lang="ts">
import Check from "@lucide/svelte/icons/check";
import Paintbrush from "@lucide/svelte/icons/paintbrush";
import Palette from "@lucide/svelte/icons/palette";
import SunMoon from "@lucide/svelte/icons/sun-moon";
import { ToggleMode } from "@nota/ui/custom/index.js";
import { getGlobalSettings } from "../constants.svelte";

const globalSettings = getGlobalSettings();

function handleThemeChange(themeName: string) {
	globalSettings.themeColor = themeName;
	setTheme(themeName);
}

function setTheme(themeName: string) {
	throw new Error("Function not implemented.");
}
const themes: any = [];
</script>

<div class="w-full max-w-xl mx-auto space-y-5 pb-8">
	<!-- Page Header -->
	<div class="space-y-0.5">
		<h2 class="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
			<Paintbrush class="size-5 text-primary" />
			<span>Appearance Settings</span>
		</h2>
		<span class="text-xs text-muted-foreground leading-snug">Customize the theme mode and primary accent color palette.</span>
	</div>

	<div class="rounded-xl border border-border/40 divide-y overflow-hidden bg-muted/10">
		<!-- Theme Mode Toggle -->
		<div class="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20">
			<div class="flex items-start gap-3.5">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50 text-primary shadow-2xs">
					<SunMoon class="size-4" />
				</div>
				<div class="space-y-0.5">
					<span class="font-medium text-sm text-foreground">Theme Mode</span>
					<p class="text-xs text-muted-foreground mt-0.5 leading-snug">Switch between light mode and dark mode interface style.</p>
				</div>
			</div>
			<ToggleMode />
		</div>

		<!-- Theme Color Swatches -->
		<div class="p-3.5 space-y-3">
			<div class="flex items-start gap-3.5">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50 text-primary shadow-2xs">
					<Palette class="size-4" />
				</div>
				<div class="space-y-0.5">
					<span class="font-medium text-sm text-foreground">Accent Palette</span>
					<p class="text-xs text-muted-foreground mt-0.5 leading-snug">Select a primary color accent for UI highlights and active controls.</p>
				</div>
			</div>

			<div class="pt-2 grid grid-cols-4 sm:grid-cols-8 gap-3">
				{#each themes as theme (theme.name)}
					{@const isSelected = globalSettings.themeColor === theme.name}
					<button
						type="button"
						class="group flex flex-col items-center gap-1.5 focus-visible:outline-none rounded-lg p-1 transition-all"
						onclick={() => handleThemeChange(theme.name)}
						title={`Set theme to ${theme.label}`}
					>
						<div
							class="relative flex size-8 items-center justify-center rounded-full border-2 transition-all duration-150 group-hover:scale-110 shadow-2xs"
							class:ring-2={isSelected}
							class:ring-primary={isSelected}
							class:ring-offset-2={isSelected}
							class:ring-offset-background={isSelected}
							style:background-color={theme.color.light}
						>
							{#if isSelected}
								<Check class="size-3.5 text-white drop-shadow-sm" />
							{/if}
						</div>
						<span class="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
							{theme.label}
						</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>




