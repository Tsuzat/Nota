<script lang="ts">
import Calendar from "@lucide/svelte/icons/calendar";
import Check from "@lucide/svelte/icons/check";
import Clock from "@lucide/svelte/icons/clock";
import Copy from "@lucide/svelte/icons/copy";
import Eye from "@lucide/svelte/icons/eye";
import List from "@lucide/svelte/icons/list";
import MoonStar from "@lucide/svelte/icons/moon-star";
import Share2 from "@lucide/svelte/icons/share-2";
import Sparkles from "@lucide/svelte/icons/sparkles";
import Sun from "@lucide/svelte/icons/sun";
import { toast } from "@nota/ui";
import * as Avatar from "@nota/ui/shadcn/avatar/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import { mode, toggleMode } from "mode-watcher";
import { onDestroy, onMount } from "svelte";
import { PUBLIC_NOTA_APP_URL } from "$app/env/public";
import type { PageData } from "./$types";

// Import styles (including KaTeX & blog typography)
import "./page.css";

const isBrowser = typeof window !== "undefined";

let { data }: { data: PageData } = $props();

const note = $derived(data.note);

let showStickyTitle = $state(false);
let copied = $state(false);
let articleElement = $state<HTMLElement | null>(null);
let toc = $state<{ id: string; text: string; level: number }[]>([]);

// Extract plain text excerpt for SEO
const plainText = $derived(
	note?.contentHtml
		? note.contentHtml
				.replace(/<[^>]*>?/gm, " ")
				.replace(/\s+/g, " ")
				.trim()
		: "",
);

const excerpt = $derived(
	plainText.length > 160 ? `${plainText.slice(0, 157)}...` : plainText,
);

// Estimate read time (~200 words per minute)
const readTimeMinutes = $derived(
	Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200)),
);

// Formatted publish date
const formattedDate = $derived(
	note?.publishedAt
		? new Date(note.publishedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: "",
);

const formattedUpdatedDate = $derived(
	note?.updatedAt && note?.publishedAt
		? new Date(note.updatedAt).getTime() -
				new Date(note.publishedAt).getTime() >
			60000
			? new Date(note.updatedAt).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				})
			: null
		: null,
);

// Author initials
const authorInitials = $derived(
	note?.author?.name
		? note.author.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "N",
);

function handleScroll() {
	if (!isBrowser) return;
	showStickyTitle = window.scrollY > 280;
}

function handleCopyLink() {
	if (!isBrowser) return;
	navigator.clipboard.writeText(window.location.href);
	copied = true;
	toast.success("Link copied to clipboard!");
	setTimeout(() => {
		copied = false;
	}, 2000);
}

function handleShareTwitter() {
	if (!isBrowser) return;
	const text = encodeURIComponent(`"${note.title}" on Nota`);
	const url = encodeURIComponent(window.location.href);
	window.open(
		`https://twitter.com/intent/tweet?text=${text}&url=${url}`,
		"_blank",
		"noopener,noreferrer",
	);
}

// Client-side code highlighting & Mermaid diagram rendering
async function setupArticleEnhancements() {
	if (!isBrowser || !articleElement) return;

	// Extract Table of Contents
	const headings = Array.from(
		articleElement.querySelectorAll("h1, h2, h3, h4, h5, h6"),
	);
	const newToc: typeof toc = [];
	headings.forEach((heading, index) => {
		if (!heading.id) {
			// create a slug from text
			const textSlug =
				heading.textContent
					?.trim()
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)+/g, "") || `heading-${index}`;
			heading.id = textSlug;
		}
		newToc.push({
			id: heading.id,
			text: heading.textContent || "",
			level: parseInt(heading.tagName[1]),
		});
	});
	toc = newToc;

	// 1. Highlight.js client-side syntax highlighting
	try {
		const hljsModule = await import("highlight.js");
		const hljs = hljsModule.default;

		const codeBlocks = articleElement.querySelectorAll<HTMLElement>("pre code");
		codeBlocks.forEach((block) => {
			// Skip mermaid code blocks
			if (
				block.classList.contains("language-mermaid") ||
				block.parentElement?.getAttribute("data-type") === "mermaid"
			) {
				return;
			}

			hljs.highlightElement(block);

			const pre = block.parentElement;
			if (pre && !pre.querySelector(".code-header")) {
				// Detect language
				const langClass = Array.from(block.classList).find((c) =>
					c.startsWith("language-"),
				);
				const lang = langClass ? langClass.replace("language-", "") : "code";

				// Create custom code header bar
				const header = document.createElement("div");
				header.className =
					"code-header flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground bg-muted/80 border-b border-border font-mono select-none rounded-t-lg";

				const langBadge = document.createElement("span");
				langBadge.textContent = lang.toUpperCase();
				langBadge.className = "font-medium text-[11px] tracking-wider";

				const copyBtn = document.createElement("button");
				copyBtn.className =
					"copy-btn inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer text-[11px]";
				copyBtn.innerHTML = `<span>Copy</span>`;

				copyBtn.onclick = () => {
					navigator.clipboard.writeText(block.innerText);
					copyBtn.innerHTML = `<span class="text-emerald-500 font-semibold">Copied!</span>`;
					setTimeout(() => {
						copyBtn.innerHTML = `<span>Copy</span>`;
					}, 2000);
				};

				header.appendChild(langBadge);
				header.appendChild(copyBtn);
				pre.insertBefore(header, block);
			}
		});
	} catch (e) {
		console.error("Failed to load highlight.js:", e);
	}

	// 2. Mermaid client-side rendering
	try {
		const mermaidModule = await import("mermaid");
		const mermaid = mermaidModule.default;

		mermaid.initialize({
			startOnLoad: false,
			theme: mode.current ? "dark" : "default",
			securityLevel: "loose",
			fontFamily: "Inter Variable, sans-serif",
		});

		// Find mermaid divs (from Edra Tiptap) and mermaid code blocks
		const mermaidNodes = articleElement.querySelectorAll<HTMLElement>(
			'div[data-type="mermaid"], pre code.language-mermaid',
		);

		for (let i = 0; i < mermaidNodes.length; i++) {
			const node = mermaidNodes[i];
			const container =
				node.tagName.toLowerCase() === "code"
					? (node.parentElement as HTMLElement)
					: node;

			const rawCode =
				container.getAttribute("data-raw-mermaid") ||
				node.textContent?.trim() ||
				"";

			if (!rawCode) continue;
			container.setAttribute("data-raw-mermaid", rawCode);

			const id = `mermaid-svg-${Date.now()}-${i}`;
			try {
				const { svg } = await mermaid.render(id, rawCode);
				container.innerHTML = svg;
				container.classList.add(
					"mermaid-rendered",
					"flex",
					"justify-center",
					"my-6",
					"p-4",
					"overflow-x-auto",
					"bg-muted/30",
					"rounded-xl",
					"border",
					"border-border/60",
				);
			} catch (err) {
				console.error("Mermaid rendering error:", err);
			}
		}
	} catch (e) {
		console.error("Failed to load mermaid:", e);
	}

	// 3. KaTeX client-side rendering
	try {
		const katexModule = await import("katex");
		const katex = katexModule.default;

		const mathNodes = articleElement.querySelectorAll<HTMLElement>(
			'span[data-type="inline-math"], div[data-type="block-math"]'
		);

		for (let i = 0; i < mathNodes.length; i++) {
			const node = mathNodes[i];
			const latex = node.getAttribute("data-latex") || node.textContent?.trim() || "";
			if (!latex) continue;

			const isBlock = node.tagName.toLowerCase() === "div" || node.getAttribute("data-type") === "block-math";

			try {
				katex.render(latex, node, {
					displayMode: isBlock,
					throwOnError: false,
					macros: {
						"\\R": "\\mathbb{R}",
						"\\N": "\\mathbb{N}",
					},
				});
				node.classList.add("katex-rendered");
			} catch (err) {
				console.error("KaTeX rendering error:", err);
			}
		}
	} catch (e) {
		console.error("Failed to load katex:", e);
	}
}

onMount(() => {
	window.addEventListener("scroll", handleScroll, { passive: true });
	handleScroll();
	setupArticleEnhancements();
});

onDestroy(() => {
	if (isBrowser) {
		window.removeEventListener("scroll", handleScroll);
	}
});

// Re-render mermaid when theme changes
$effect(() => {
	if (isBrowser && mode.current) {
		setupArticleEnhancements();
	}
});
</script>

<svelte:head>
  <title>{note.title} — Nota</title>
  <meta name="description" content={excerpt} />
  <link rel="canonical" href={isBrowser ? window.location.href : ""} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content={note.title} />
  <meta property="og:description" content={excerpt} />
  <meta property="og:site_name" content="Nota" />
  {#if note.publishedAt}
    <meta
      property="article:published_time"
      content={new Date(note.publishedAt).toISOString()}
    />
  {/if}
  {#if note.author?.name}
    <meta property="article:author" content={note.author.name} />
  {/if}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={note.title} />
  <meta name="twitter:description" content={excerpt} />

  <!-- Robots -->
  <meta
    name="robots"
    content={note.shouldIndex ? "index, follow" : "noindex, nofollow"}
  />
</svelte:head>

<!-- Main Blog Post Container -->
<main class="min-h-screen bg-background pb-20">
  <div
    class="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 relative flex justify-center"
  >
    <article class="flex-1 min-w-0 w-full">
      <!-- Article Header -->
      <header class="space-y-6 mb-10 pb-8 border-b border-border/60">
        <!-- Title -->
        <h1
          class="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance"
        >
          {note.title}
        </h1>

        <!-- Badges / Category bar -->
        <div
          class="flex items-center gap-2 text-xs text-muted-foreground flex-wrap"
        >
          {#if readTimeMinutes}
            <span class="flex items-center gap-1">
              <Clock class="size-3" />
              {readTimeMinutes} min read
            </span>
          {/if}

          {#if typeof note.viewCount === "number" && note.viewCount > 0}
            <span class="flex items-center gap-1">
              <Eye class="size-3" />
              {note.viewCount.toLocaleString()}
              {note.viewCount === 1 ? "view" : "views"}
            </span>
          {/if}
        </div>

        <!-- Author Info & Date Metadata -->
        <div class="flex items-center justify-between gap-4 pt-2 flex-wrap">
          <div class="flex items-center gap-3">
            <Avatar.Root class="size-10 border border-border/80 shadow-2xs">
              {#if note.author?.image}
                <Avatar.Image src={note.author.image} alt={note.author.name} />
              {/if}
              <Avatar.Fallback
                class="text-xs font-semibold bg-primary/10 text-primary"
              >
                {authorInitials}
              </Avatar.Fallback>
            </Avatar.Root>

            <div class="flex flex-col">
              <span class="text-sm font-semibold text-foreground leading-tight">
                {note.author?.name || "Nota Writer"}
              </span>
              <div
                class="flex items-center gap-2 text-xs text-muted-foreground mt-0.5"
              >
                {#if formattedDate}
                  <span class="flex items-center gap-1">
                    <Calendar class="size-3" />
                    {formattedDate}
                  </span>
                {/if}
                {#if formattedUpdatedDate}
                  <span>• Updated {formattedUpdatedDate}</span>
                {/if}
              </div>
            </div>
          </div>

          <!-- Quick Share Options -->
          <div class="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onclick={toggleMode}
              aria-label="Toggle theme"
            >
              <Sun
                class="scale-100 dark:scale-0 rotate-0 dark:rotate-180 transition-transform"
              />
              <MoonStar
                class="absolute dark:scale-100 scale-0 rotate-180 dark:rotate-0 transition-transform"
              />
            </Button>
            <Button
              variant="outline"
              onclick={handleShareTwitter}
              title="Share on X"
            >
              <svg class="fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                ></path>
              </svg>
              <span class="hidden sm:inline">Post</span>
            </Button>

            <Button
              variant="outline"
              onclick={handleCopyLink}
              title="Copy link"
            >
              {#if copied}
                <Check class=" text-emerald-500" />
              {:else}
                <Copy />
              {/if}
              <span class="hidden sm:inline"
                >{copied ? "Copied" : "Copy Link"}</span
              >
            </Button>
          </div>
        </div>
      </header>

      <!-- Article Content HTML -->
      <div
        bind:this={articleElement}
        class="article-content prose dark:prose-invert max-w-none text-foreground leading-relaxed"
      >
        {@html note.contentHtml}
      </div>

      <!-- Article Footer -->
      <footer class="mt-16 pt-10 border-t border-border/60 space-y-8">
        <!-- Author Card -->
        <div
          class="flex items-start sm:items-center gap-4 p-5 rounded-2xl bg-muted/40 border border-border/60"
        >
          <Avatar.Root
            class="size-12 border border-border/80 shadow-2xs shrink-0"
          >
            {#if note.author?.image}
              <Avatar.Image src={note.author.image} alt={note.author.name} />
            {/if}
            <Avatar.Fallback
              class="text-sm font-semibold bg-primary/10 text-primary"
            >
              {authorInitials}
            </Avatar.Fallback>
          </Avatar.Root>

          <div class="flex-1 min-w-0">
            <span
              class="text-xs text-muted-foreground uppercase font-medium tracking-wider"
            >
              Written By
            </span>
            <h2 class="text-base font-semibold text-foreground truncate">
              {note.author?.name || "Nota Writer"}
            </h2>
            <p class="text-xs text-muted-foreground mt-0.5">
              Published with <a href="/" class="text-primary hover:underline"
                >Nota</a
              >.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            class="text-xs gap-1.5 shrink-0"
            onclick={handleCopyLink}
          >
            <Share2 class="size-3.5" />
            Share
          </Button>
        </div>

        <!-- Nota CTA Banner -->
        <div
          class="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center space-y-4"
        >
          <div
            class="inline-flex p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs"
          >
            <Sparkles class="size-6" />
          </div>
          <div class="space-y-1.5 max-w-md mx-auto">
            <h3
              class="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground"
            >
              Write, organize, and publish with Nota
            </h3>
            <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nota is a modern, blazing-fast notes and thinking workspace. Write
              in markdown, organize seamlessly, and publish articles with one
              click.
            </p>
          </div>
          <div class="pt-2 flex justify-center gap-3">
            <Button
              href={PUBLIC_NOTA_APP_URL || "/signin"}
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium shadow-sm gap-2"
            >
              Get Started Free
            </Button>
            <Button href="/" variant="outline">Learn More</Button>
          </div>
        </div>
      </footer>
    </article>

    <!-- Table of Contents (Right Sidebar Hover) -->
    {#if toc.length > 0}
      <div class="fixed right-0 top-32 z-40 group flex">
        <!-- Trigger Icon -->
        <div
          class="bg-popover/50 backdrop-blur border border-border/60 border-r-0 rounded-l-xl p-2.5 shadow-sm group-hover:opacity-0 transition-opacity flex items-start justify-center text-muted-foreground mt-4 cursor-pointer"
        >
          <List class="size-5" />
        </div>

        <!-- Expandable content -->
        <aside
          class="w-72 max-h-[calc(100vh-10rem)] overflow-y-auto bg-background/95 backdrop-blur border border-border/60 shadow-xl rounded-l-xl p-5 absolute right-0 top-0 translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <div class="space-y-4">
            <h4
              class="font-medium text-sm text-foreground/90 uppercase tracking-wider flex items-center gap-2"
            >
              <List class="size-4" />
              On this page
            </h4>
            <nav class="flex flex-col space-y-2.5 text-sm">
              {#each toc as item}
                <a
                  href="#{item.id}"
                  class="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md px-1.5 py-1 -ml-1.5 transition-colors line-clamp-2 leading-tight"
                  style="padding-left: {Math.max(0, item.level - 2) * 0.75 +
                    0.375}rem"
                >
                  {item.text}
                </a>
              {/each}
            </nav>
          </div>
        </aside>
      </div>
    {/if}
  </div>
</main>
