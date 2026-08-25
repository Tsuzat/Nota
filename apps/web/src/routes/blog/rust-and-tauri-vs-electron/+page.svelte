<script lang="ts">
import Check from "@lucide/svelte/icons/check";
import LinkIcon from "@lucide/svelte/icons/link";
import { toast } from "@nota/ui";
import { Badge } from "@nota/ui/shadcn/badge/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.js";
import { Separator } from "@nota/ui/shadcn/separator/index.js";
import { resolve } from "$app/paths";

let copied = $state(false);

async function copyArticleLink() {
	try {
		await navigator.clipboard.writeText(window.location.href);
		copied = true;
		toast.success("Link copied to clipboard");
		setTimeout(() => {
			copied = false;
		}, 2000);
	} catch {
		toast.error("Failed to copy link");
	}
}
</script>

<svelte:head>
  <title>Why We Built Nota with Rust & Tauri Instead of Electron | Nota Blog</title>
  <meta
    name="description"
    content="How native webviews and Rust-powered storage reduced memory usage by 80% and achieved instant cold start times."
  />
</svelte:head>

<header class="mb-10 space-y-4">
  <div class="flex items-center gap-2 text-xs text-muted-foreground">
    <Badge variant="outline" class="text-xs">Engineering</Badge>
    <span>•</span>
    <time>July 24, 2026</time>
    <span>•</span>
    <span>6 min read</span>
  </div>

  <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
    Why We Built Nota with Rust and Tauri Instead of Electron
  </h1>

  <p class="text-lg text-muted-foreground leading-relaxed">
    When we started designing a modern note-taking client, our hardest engineering constraint was simple: it must open faster than your thoughts can escape.
  </p>

  <div class="flex items-center justify-between border-y py-3 text-xs text-muted-foreground">
    <span>By Tsuzat & The Nota Team</span>
    <Button variant="ghost" size="sm" class="h-7 text-xs gap-1.5" onclick={copyArticleLink}>
      {#if copied}
        <Check class="size-3.5 text-emerald-500" />
        <span>Copied</span>
      {:else}
        <LinkIcon class="size-3.5" />
        <span>Share</span>
      {/if}
    </Button>
  </div>
</header>

<article class="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
  <p>
    In modern software engineering, developers often default to Electron for desktop development because it bridges web code directly to desktop binaries. However, this ease of distribution comes with a hidden tax: shipping an entire embedded Chromium web browser and Node.js runtime inside every application.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    The Resource Footprint Problem
  </h2>

  <p>
    When a user simultaneously keeps a chat application, a code editor, a project board, and a note-taking tool open—all built on Electron—system RAM consumption easily surpasses 3 gigabytes simply to maintain idle interfaces. For laptop users away from a power outlet, this sustained background processing triggers CPU throttling and accelerates battery depletion.
  </p>

  <!-- Benchmark Comparison Cards -->
  <div class="grid gap-4 sm:grid-cols-3 my-6">
    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Cold Start</div>
      <div class="text-2xl font-bold text-foreground mt-1">&lt; 50 ms</div>
      <div class="text-xs text-muted-foreground mt-1">Instant launcher response</div>
    </Card.Root>

    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Idle RAM</div>
      <div class="text-2xl font-bold text-foreground mt-1">~45 MB</div>
      <div class="text-xs text-muted-foreground mt-1">80% reduction vs Electron</div>
    </Card.Root>

    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Binary Size</div>
      <div class="text-2xl font-bold text-foreground mt-1">&lt; 15 MB</div>
      <div class="text-xs text-muted-foreground mt-1">Native OS WebViews</div>
    </Card.Root>
  </div>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    Enter Rust & Tauri
  </h2>

  <p>
    Instead of shipping Chromium, <a href="https://tauri.app/" target="_blank" class="text-primary hover:underline">Tauri</a> leverages the host operating system's native webview renderer (WKWebView on macOS, WebView2 on Windows, and WebKit on Linux). This architectural shift immediately shrinks download installers from 150 megabytes down to under 15 megabytes.
  </p>

  <p>
    Under the hood, Nota handles local file system operations, SQLite database transactions, and file encryption natively within safe, highly optimized <strong>Rust threads</strong>. When you hit a global shortcut to capture a quick note, the app window mounts instantaneously—clocking under 50 milliseconds from invocation to an active text cursor.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    Key Architectural Advantages
  </h2>

  <ul class="space-y-2 list-disc pl-5">
    <li><strong>80% reduction in average RAM usage:</strong> ~45 MB vs ~400 MB in comparable tools.</li>
    <li><strong>Sub-50ms cold start execution:</strong> rivaling native utilities like Apple Notes.</li>
    <li><strong>Zero cross-platform compromises:</strong> maintaining identical rich Tiptap formatting across desktop and web browser instances.</li>
  </ul>
</article>

<Separator class="my-10" />

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-lg border bg-muted/20">
  <div class="space-y-1 text-center sm:text-left">
    <div class="font-semibold text-foreground">Experience Native Desktop Speed</div>
    <div class="text-xs text-muted-foreground">Available on macOS, Windows, and Linux.</div>
  </div>
  <Button href={resolve("/#pricing")}>
    Download Free
  </Button>
</div>
