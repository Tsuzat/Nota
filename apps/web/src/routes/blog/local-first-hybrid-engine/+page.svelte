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
  <title>Local-First Without the Complexity: Inside Nota's Hybrid Engine | Nota Blog</title>
  <meta
    name="description"
    content="How Nota reconciles device-local SQLite storage with seamless real-time cloud collaboration without manual Git setup."
  />
</svelte:head>

<header class="mb-10 space-y-4">
  <div class="flex items-center gap-2 text-xs text-muted-foreground">
    <Badge variant="outline" class="text-xs">Architecture</Badge>
    <span>•</span>
    <time>July 2, 2026</time>
    <span>•</span>
    <span>6 min read</span>
  </div>

  <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
    Local-First Without the Complexity: Inside Nota's Hybrid Engine
  </h1>

  <p class="text-lg text-muted-foreground leading-relaxed">
    How we engineered local SQLite storage and real-time collaboration into a unified workspace without requiring custom Git hooks or paid sync add-ons.
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
    The term "local-first" reflects a fundamental principle: users should own their personal data, writing should reside securely on local disk storage by default, and software must operate seamlessly regardless of network connectivity.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    The Synchronization Dilemma
  </h2>

  <p>
    Historically, local-first note-taking meant isolating files to a single device. Multi-device sync often required purchasing proprietary add-ons or managing brittle third-party sync scripts with iCloud or Git that frequently created duplicate conflict files.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    The Dual-Layer Architecture
  </h2>

  <p>
    Nota introduces a dual-layer workspace model. By default, notes are stored in a local SQLite database on your device via our Rust desktop core—operating completely offline with zero telemetry.
  </p>

  <p>
    When a workspace requires team collaboration or cloud access, it can be configured as a <strong>Cloud Workspace</strong>. Nota handles real-time synchronization while maintaining continuous client-side snapshot backups on your local disk.
  </p>

  <!-- Architecture Cards -->
  <div class="grid gap-4 sm:grid-cols-2 my-6">
    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Local Layer (Default)</div>
      <div class="text-xl font-bold text-foreground mt-1">100% Offline SQLite</div>
      <div class="text-xs text-muted-foreground mt-1">Direct disk storage, zero telemetry, and sub-millisecond search indexing.</div>
    </Card.Root>

    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Cloud Workspace Layer</div>
      <div class="text-xl font-bold text-foreground mt-1">Encrypted Hybrid Sync</div>
      <div class="text-xs text-muted-foreground mt-1">Real-time collaboration with automatic local snapshot redundancy.</div>
    </Card.Root>
  </div>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    Snapshot Recovery
  </h2>

  <p>
    Because cloud workspaces maintain local snapshots during editing sessions, document state can be restored directly from a local client snapshot if accidental deletions occur. This provides the speed of local desktop software with the safety of cloud versioning.
  </p>
</article>

<Separator class="my-10" />

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-lg border bg-muted/20">
  <div class="space-y-1 text-center sm:text-left">
    <div class="font-semibold text-foreground">Own your personal writing</div>
    <div class="text-xs text-muted-foreground">Unlimited free local workspaces with zero vendor lock-in.</div>
  </div>
  <Button href={resolve("/#pricing")}>
    Start Writing Free
  </Button>
</div>
