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
  <title>The Nota Feature Guide: Rich Editor, Mermaid Diagrams, LaTeX & AI | Nota Blog</title>
  <meta
    name="description"
    content="A walkthrough of Nota's native writing capabilities: slash commands, KaTeX math rendering, vector diagramming, and zero-tax BYOK AI."
  />
</svelte:head>

<header class="mb-10 space-y-4">
  <div class="flex items-center gap-2 text-xs text-muted-foreground">
    <Badge variant="outline" class="text-xs">Product</Badge>
    <span>•</span>
    <time>August 2, 2026</time>
    <span>•</span>
    <span>7 min read</span>
  </div>

  <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
    The Nota Feature Guide: Rich Editor, Mermaid Diagrams, LaTeX & Sovereign AI
  </h1>

  <p class="text-lg text-muted-foreground leading-relaxed">
    An overview of Nota's native writing capabilities designed for software architects, researchers, technical writers, and thinkers.
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
    Modern note-taking tools often force a compromise: plain-text editors that lack native formatting, or heavy cloud suites that slow down under complex documents. Nota combines an intuitive WYSIWYG writing experience with technical capabilities like inline LaTeX, code execution blocks, and Mermaid diagrams—all running on a local-first Rust engine.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    1. Rich Text Editor & Slash Commands
  </h2>

  <p>
    Nota's editor is built on top of a custom-tuned Tiptap foundation. Typing <code>/</code> opens an inline command palette to insert structural elements without breaking your keyboard flow:
  </p>

  <div class="grid gap-3 sm:grid-cols-2 my-6">
    <Card.Root class="p-4">
      <div class="font-semibold text-foreground text-sm">Interactive Tables</div>
      <div class="text-xs text-muted-foreground mt-1">Insert and resize data matrices with keyboard navigation and clean alignment.</div>
    </Card.Root>

    <Card.Root class="p-4">
      <div class="font-semibold text-foreground text-sm">Callouts & Highlights</div>
      <div class="text-xs text-muted-foreground mt-1">Format warnings, notes, and tips with distinct colored callout blocks.</div>
    </Card.Root>

    <Card.Root class="p-4">
      <div class="font-semibold text-foreground text-sm">Syntax Highlighted Code</div>
      <div class="text-xs text-muted-foreground mt-1">Support for dozens of languages with line numbers and one-click copy.</div>
    </Card.Root>

    <Card.Root class="p-4">
      <div class="font-semibold text-foreground text-sm">Media Embeds</div>
      <div class="text-xs text-muted-foreground mt-1">Embed YouTube videos, audio clips, and images directly in document flow.</div>
    </Card.Root>
  </div>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    2. Native Mermaid.js Diagrams
  </h2>

  <p>
    Technical documentation often requires visual diagrams. With native Mermaid support, you can write declarative syntax that renders immediately as responsive vector flowcharts, sequence diagrams, and architecture graphs:
  </p>

  <pre class="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto text-foreground"><code>graph TD
  A[Client Request] --> B[Rust Core Engine]
  B --> C[SQLite Local Database]
  B --> D[Encrypted Cloud Sync]</code></pre>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    3. KaTeX & LaTeX Scientific Math
  </h2>

  <p>
    For scientific and mathematical writing, Nota integrates KaTeX rendering for both inline formulas (e.g. <code>$E = mc^2$</code>) and standalone multi-line proof blocks evaluated in real-time.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    4. Sovereign Bring Your Own Key (BYOK) AI
  </h2>

  <p>
    Instead of recurring monthly AI markups, Nota enables you to connect your personal API keys for OpenAI, Anthropic Claude, or Google Gemini. Your prompts are routed directly from your local device to the AI provider with zero intermediary logging.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    5. Clean Export & Zero Lock-in
  </h2>

  <p>
    Your notes can be exported at any time to clean standard Markdown, structured JSON archives, or formatted PDF documents with rendered diagrams and mathematical typography intact.
  </p>
</article>

<Separator class="my-10" />

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-lg border bg-muted/20">
  <div class="space-y-1 text-center sm:text-left">
    <div class="font-semibold text-foreground">Try Nota's native editor</div>
    <div class="text-xs text-muted-foreground">Free for personal use across macOS, Windows, Linux, and Web.</div>
  </div>
  <Button href={resolve("/#pricing")}>
    Download Free
  </Button>
</div>
