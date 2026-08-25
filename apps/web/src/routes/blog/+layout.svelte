<script lang="ts">
import ArrowLeft from "@lucide/svelte/icons/arrow-left";
import { ToggleMode } from "@nota/ui";
import { Badge } from "@nota/ui/shadcn/badge/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Separator } from "@nota/ui/shadcn/separator/index.js";
import { AppLogo } from "#components/custom/index.js";
import Particles from "#components/custom/landing/particles.svelte";
import { resolve } from "$app/paths";
import { page } from "$app/state";

const { children } = $props();

let scrollProgress = $state(0);

function handleScroll() {
	const totalHeight =
		document.documentElement.scrollHeight - window.innerHeight;
	if (totalHeight > 0) {
		scrollProgress = Math.min(
			100,
			Math.max(0, (window.scrollY / totalHeight) * 100),
		);
	}
}

const isBlogIndex = $derived(
	page.url.pathname === "/blog" || page.url.pathname === "/blog/",
);
</script>

<svelte:window onscroll={handleScroll} />

<!-- Scroll Reading Progress Bar -->
<div class="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none">
	<div
		class="h-full bg-primary transition-[width] duration-150 ease-out"
		style="width: {scrollProgress}%"
	></div>
</div>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />

<header
	class="sticky top-0 z-40 mx-auto flex max-w-5xl items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8 border-b border-border/40"
>
	<div class="flex items-center gap-3">
		<AppLogo />
		<Separator orientation="vertical" class="hidden sm:block h-4" />
		<Badge variant="outline" class="hidden text-xs sm:inline-flex">
			Blog & Insights
		</Badge>
	</div>
	<div class="flex items-center gap-2.5">
		{#if isBlogIndex}
			<Button variant="ghost" href={resolve("/")}>
				<ArrowLeft />
				<span>Back to Home</span>
			</Button>
		{:else}
			<Button variant="ghost" href={resolve("/blog")}>
				<ArrowLeft />
				<span>Back to Blog</span>
			</Button>
		{/if}
		<ToggleMode />
		<Button variant="default" href={resolve("/#pricing")} class="hidden sm:inline-flex">
			Get Nota Free
		</Button>
	</div>
</header>

<main class="mx-auto max-w-5xl px-4 py-12 sm:px-8">
	{@render children()}
</main>

<footer class="mt-20 border-t py-8 text-center text-sm text-muted-foreground">
	<div
		class="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-4 sm:justify-between"
	>
		<div class="flex items-center gap-2">
			<span>© 2026 Nota. Built natively with Svelte & Rust.</span>
		</div>
		<div class="flex items-center gap-3 text-xs">
			<a href={resolve("/(tnc)/terms")} class="hover:text-primary transition-colors">
				Terms of Use
			</a>
			<span>•</span>
			<a href={resolve("/(tnc)/privacy")} class="hover:text-primary transition-colors">
				Privacy Policy
			</a>
			<span>•</span>
			<a href="mailto:contact@nota.ink" class="hover:text-primary transition-colors">
				Contact Us
			</a>
		</div>
	</div>
</footer>
