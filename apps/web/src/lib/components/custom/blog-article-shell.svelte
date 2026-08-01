<script lang="ts">
import ToggleMode from '@nota/ui/custom/ToggleMode.svelte';
import { icons } from '@nota/ui/icons';
import { Button } from '@nota/ui/shadcn/button';
import type { Snippet } from 'svelte';
import { resolve } from '$app/paths';
import AppLogo from '$lib/components/custom/applogo.svelte';
import Particles from '$lib/components/custom/landing/particles.svelte';

interface Props {
  /** Label shown next to the logo in the sticky header (e.g. "Architecture", "AI Economics") */
  headerSubtitle?: string;
  /** Whether to show the "Try Nota Free" CTA button in the header */
  showHeaderCta?: boolean;
  /** Max-width class for the `<main>` container (default: "max-w-3xl") */
  mainMaxWidth?: string;
  /** The article body content */
  children: Snippet;
}

let { headerSubtitle = 'Blog', showHeaderCta = false, mainMaxWidth = 'max-w-3xl', children }: Props = $props();
</script>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />

<header
	class="sticky top-0 z-50 mx-auto flex max-w-6xl items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8"
>
	<div class="flex items-center gap-4">
		<AppLogo />
		<span
			class="border-l pl-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase hidden sm:inline-block"
		>
			{headerSubtitle}
		</span>
	</div>
	<div class="flex items-center gap-3">
		<Button
			variant="ghost"
			size="sm"
			href={resolve("/blog")}
			class="gap-2 text-xs md:text-sm font-medium"
		>
			<icons.ArrowLeft class="size-4" />
			<span>Back to Blog</span>
		</Button>
		<ToggleMode />
		{#if showHeaderCta}
			<Button
				variant="default"
				size="sm"
				href={resolve("/#pricing")}
				class="hidden rounded-full font-semibold sm:inline-flex"
			>
				Try Nota Free
			</Button>
		{/if}
	</div>
</header>

<main class="mx-auto {mainMaxWidth} px-4 py-12 sm:px-8">
	{@render children()}
</main>

<footer class="mt-20 border-t py-8 text-center text-sm text-muted-foreground">
	<div
		class="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 sm:justify-between"
	>
		<div class="flex items-center gap-2">
			<span>© 2026 Nota. Built natively with Svelte & Rust.</span>
		</div>
		<div class="flex items-center gap-4 text-xs">
			<a href={resolve("/terms")} class="hover:text-primary transition-colors">Terms of Use</a>
			<span>•</span>
			<a href={resolve("/privacy")} class="hover:text-primary transition-colors">Privacy Policy</a>
			<span>•</span>
			<a href="mailto:contact@nota.ink" class="hover:text-primary transition-colors">Contact Us</a>
		</div>
	</div>
</footer>
