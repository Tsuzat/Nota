<script lang="ts">
import Check from "@lucide/svelte/icons/check";
import LinkIcon from "@lucide/svelte/icons/link";
import { toast } from "@nota/ui";
import { Badge } from "@nota/ui/shadcn/badge/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.js";
import { Separator } from "@nota/ui/shadcn/separator/index.js";
import * as Table from "@nota/ui/shadcn/table/index.js";
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

const comparisonRows = [
	{
		feature: "Runtime Architecture",
		nota: "Rust + Tauri (Native OS Webview)",
		notion: "Electron (Bundled Chromium)",
		obsidian: "Electron (Bundled Chromium)",
		evernote: "Electron",
	},
	{
		feature: "Cold Launch Speed",
		nota: "< 50 ms",
		notion: "2 – 4 seconds",
		obsidian: "~500 ms",
		evernote: "2 – 3 seconds",
	},
	{
		feature: "Idle RAM Usage",
		nota: "~45 MB",
		notion: "350 – 800 MB",
		obsidian: "150 – 400 MB",
		evernote: "400 – 900 MB",
	},
	{
		feature: "Default Storage",
		nota: "Local SQLite on Device",
		notion: "Remote Cloud Only",
		obsidian: "Local Markdown Files",
		evernote: "Remote Cloud Only",
	},
	{
		feature: "Offline Access",
		nota: "100% Fully Functional",
		notion: "Limited (Recent Cache)",
		obsidian: "100% Fully Functional",
		evernote: "Limited",
	},
	{
		feature: "Multi-Device Sync",
		nota: "Native Hybrid Cloud Sync",
		notion: "Built-in Cloud Sync",
		obsidian: "$48/yr Sync or DIY Git",
		evernote: "Paid Plan Required",
	},
	{
		feature: "AI Integration Model",
		nota: "BYOK (At-cost tokens) + Pro Credits",
		notion: "$120/yr Add-on Subscription",
		obsidian: "Third-party Plugin Setup",
		evernote: "Top-tier Plan Only",
	},
	{
		feature: "Rich Text & Math",
		nota: "Tiptap + LaTeX + Mermaid",
		notion: "Block Canvas + KaTeX",
		obsidian: "Plaintext (Plugins for visual)",
		evernote: "Basic Formatting",
	},
	{
		feature: "Data Portability",
		nota: "Standard Markdown & JSON Export",
		notion: "Proprietary Blocks",
		obsidian: "Plain Markdown Files",
		evernote: "Proprietary Database",
	},
];
</script>

<svelte:head>
  <title>Nota vs. Notion vs. Obsidian vs. Evernote: The 2026 Showdown</title>
  <meta
    name="description"
    content="An architectural and workflow comparison evaluating speed, memory efficiency, local-first storage, AI pricing, and collaboration."
  />
</svelte:head>

<header class="mb-10 space-y-4">
  <div class="flex items-center gap-2 text-xs text-muted-foreground">
    <Badge variant="outline" class="text-xs">Comparison</Badge>
    <span>•</span>
    <time>August 1, 2026</time>
    <span>•</span>
    <span>8 min read</span>
  </div>

  <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
    Nota vs. Notion vs. Obsidian vs. Evernote: The 2026 Note-Taking Showdown
  </h1>

  <p class="text-lg text-muted-foreground leading-relaxed">
    An in-depth look at how runtime architecture, storage models, and AI economics affect daily writing velocity and long-term data ownership.
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
    For the past decade, personal productivity software has been divided between two distinct philosophies. On one side are centralized cloud suites like Notion and Evernote, which provide polished collaboration but lock your writing to remote servers and impose high resource overhead. On the other side are plaintext tools like Obsidian, which guarantee local data ownership but offload the complexity of synchronization, styling, and plugins onto the user.
  </p>

  <p>
    Nota was created to bridge this divide: providing the speed and privacy of a native local-first engine with the convenience of seamless cloud collaboration and rich editing out of the box.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    Architecture: Rust & Tauri vs. Electron
  </h2>

  <p>
    Most mainstream desktop applications—including Notion, Obsidian, and Evernote—are built using Electron. While Electron accelerates multi-platform distribution, it bundles a complete Chromium browser and Node.js runtime inside each app.
  </p>

  <p>
    Nota uses Tauri with a Rust backend. By utilizing the operating system's native webview and executing SQLite database queries, search indexing, and cryptographic operations directly in Rust threads, Nota achieves a fraction of the memory footprint of conventional tools.
  </p>

  <div class="my-6 grid gap-4 sm:grid-cols-3">
    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Launch Time</div>
      <div class="text-2xl font-bold text-foreground mt-1">&lt; 50 ms</div>
      <div class="text-xs text-muted-foreground mt-1">Instant window mounting</div>
    </Card.Root>

    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Memory Usage</div>
      <div class="text-2xl font-bold text-foreground mt-1">~45 MB</div>
      <div class="text-xs text-muted-foreground mt-1">80% lighter than Electron</div>
    </Card.Root>

    <Card.Root class="p-5">
      <div class="text-xs text-muted-foreground font-medium">Storage Engine</div>
      <div class="text-2xl font-bold text-foreground mt-1">SQLite</div>
      <div class="text-xs text-muted-foreground mt-1">Local, transactional, indexed</div>
    </Card.Root>
  </div>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    Comparison Matrix
  </h2>

  <div class="my-6 overflow-x-auto rounded-lg border">
    <Table.Root class="w-full text-sm">
      <Table.Header>
        <Table.Row class="bg-muted/50">
          <Table.Head class="font-semibold text-foreground">Feature</Table.Head>
          <Table.Head class="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-x border-emerald-500/30">Nota</Table.Head>
          <Table.Head class="font-medium text-muted-foreground">Notion</Table.Head>
          <Table.Head class="font-medium text-muted-foreground">Obsidian</Table.Head>
          <Table.Head class="font-medium text-muted-foreground">Evernote</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each comparisonRows as row (row.feature)}
          <Table.Row>
            <Table.Cell class="font-medium text-foreground">{row.feature}</Table.Cell>
            <Table.Cell class="font-semibold text-foreground bg-emerald-500/5 border-x border-emerald-500/30">{row.nota}</Table.Cell>
            <Table.Cell class="text-muted-foreground">{row.notion}</Table.Cell>
            <Table.Cell class="text-muted-foreground">{row.obsidian}</Table.Cell>
            <Table.Cell class="text-muted-foreground">{row.evernote}</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    AI Integration: BYOK vs. Monthly Subscriptions
  </h2>

  <p>
    Many note-taking platforms charge a recurring $10 to $15 monthly fee for embedded AI assistants. In practice, the average writer consumes less than $0.50 worth of compute tokens over an entire month of drafting and summarization.
  </p>

  <p>
    Nota supports a <strong>Bring Your Own Key (BYOK)</strong> model. You can enter your personal API key for OpenAI (GPT-4o), Anthropic (Claude 3.5), or Google (Gemini) directly in the desktop app. Prompts are transmitted directly from your device to the model provider with zero intermediary logging, allowing you to pay exact at-cost rates.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    Storage & Collaboration
  </h2>

  <p>
    By default, Nota saves all notes locally in an encrypted SQLite database on your device. When real-time collaboration or multi-device access is needed, any workspace can be synced via Nota Cloud Workspaces with end-to-end encryption and automatic version history.
  </p>

  <h2 class="text-xl sm:text-2xl font-bold text-foreground mt-8 border-b pb-2">
    Summary: Which Tool to Choose?
  </h2>

  <ul class="space-y-2 list-disc pl-5">
    <li><strong>Choose Notion</strong> if your primary requirement is large-team project management with extensive relational databases and project boards.</li>
    <li><strong>Choose Obsidian</strong> if you want complete control over a folder of plaintext files and prefer manually configuring community plugins.</li>
    <li><strong>Choose Nota</strong> if you want a fast native desktop application, local-first offline storage by default, out-of-the-box rich editing with LaTeX and diagrams, and flexible at-cost AI integration.</li>
  </ul>
</article>

<Separator class="my-10" />

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-lg border bg-muted/20">
  <div class="space-y-1 text-center sm:text-left">
    <div class="font-semibold text-foreground">Get started with Nota</div>
    <div class="text-xs text-muted-foreground">Free for personal use on macOS, Windows, Linux, and Web.</div>
  </div>
  <Button href={resolve("/#pricing")}>
    Download Free
  </Button>
</div>
