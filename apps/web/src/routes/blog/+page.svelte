<script lang="ts">
import ArrowRight from "@lucide/svelte/icons/arrow-right";
import Clock from "@lucide/svelte/icons/clock";
import { Badge } from "@nota/ui/shadcn/badge/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.js";
import { resolve } from "$app/paths";

interface BlogPost {
	slug: string;
	title: string;
	excerpt: string;
	category: string;
	readTime: string;
	date: string;
}

const featuredArticle: BlogPost = {
	slug: resolve("/blog/nota-vs-notion-vs-obsidian"),
	title:
		"Nota vs. Notion vs. Obsidian vs. Evernote: The 2026 Note-Taking Showdown",
	excerpt:
		"An architectural and workflow comparison exploring why modern thinkers and developers are switching to a lightweight, local-first engine with native Rust performance.",
	category: "Comparison",
	readTime: "8 min read",
	date: "August 1, 2026",
};

const articles: BlogPost[] = [
	{
		slug: resolve("/blog/nota-feature-showcase"),
		title:
			"The Nota Feature Guide: Rich Editor, Mermaid Diagrams, LaTeX & Sovereign AI",
		excerpt:
			"A walkthrough of Nota's native writing capabilities: slash commands, KaTeX math rendering, vector diagramming, and zero-tax BYOK AI.",
		category: "Product",
		readTime: "7 min read",
		date: "August 2, 2026",
	},
	{
		slug: resolve("/blog/rust-and-tauri-vs-electron"),
		title: "Why We Built Nota with Rust and Tauri Instead of Electron",
		excerpt:
			"How native webviews and Rust-powered storage reduced memory usage by 80% and achieved instant cold start times.",
		category: "Engineering",
		readTime: "6 min read",
		date: "July 24, 2026",
	},
	{
		slug: resolve("/blog/byok-ai-note-taking"),
		title: "Bring Your Own Key (BYOK): The Case for At-Cost AI Note-Taking",
		excerpt:
			"Why recurring $10/month AI subscription markups are unnecessary, and how connecting direct API keys provides private AI at wholesale token cost.",
		category: "AI & Privacy",
		readTime: "5 min read",
		date: "July 15, 2026",
	},
	{
		slug: resolve("/blog/local-first-hybrid-engine"),
		title: "Local-First Without the Complexity: Inside Nota's Hybrid Engine",
		excerpt:
			"How Nota reconciles device-local SQLite storage with seamless real-time cloud collaboration without manual Git setup.",
		category: "Architecture",
		readTime: "6 min read",
		date: "July 2, 2026",
	},
];

let selectedCategory = $state("All");
const categories = [
	"All",
	"Comparison",
	"Product",
	"Engineering",
	"AI & Privacy",
	"Architecture",
];

const displayedArticles = $derived(
	selectedCategory === "All"
		? articles
		: articles.filter((a) => a.category === selectedCategory),
);
</script>

<svelte:head>
  <title>Blog & Insights | Nota</title>
  <meta
    name="description"
    content="Engineering deep dives, architecture notes, and product updates from the Nota team."
  />
</svelte:head>

<!-- Header -->
<div class="mb-10 space-y-2 text-left">
  <h1 class="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
    Nota Blog
  </h1>
  <p class="text-base text-muted-foreground max-w-2xl">
    Engineering deep dives, product updates, and articles on local-first architecture and modern note-taking workflows.
  </p>
</div>

<!-- Category Filters -->
<div
  role="tablist"
  aria-label="Blog Category Filters"
  class="mb-8 flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-4"
>
  {#each categories as cat (cat)}
    <Button
      role="tab"
      aria-selected={selectedCategory === cat}
      variant={selectedCategory === cat ? "secondary" : "ghost"}
      size="sm"
      class="text-xs h-8 px-3 {selectedCategory === cat ? 'font-semibold' : 'text-muted-foreground'}"
      onclick={() => {
        selectedCategory = cat;
      }}
    >
      {cat}
    </Button>
  {/each}
</div>

<!-- Featured Article -->
{#if selectedCategory === "All" || selectedCategory === featuredArticle.category}
  <a href={featuredArticle.slug} class="group block mb-10">
    <Card.Root class="p-6 sm:p-8 transition-colors hover:bg-muted/30">
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" class="text-xs">
            {featuredArticle.category}
          </Badge>
          <span>•</span>
          <time>{featuredArticle.date}</time>
          <span>•</span>
          <span class="inline-flex items-center gap-1">
            <Clock class="size-3" />
            {featuredArticle.readTime}
          </span>
        </div>

        <Card.Title class="text-xl sm:text-2xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {featuredArticle.title}
        </Card.Title>

        <Card.Description class="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {featuredArticle.excerpt}
        </Card.Description>

        <div class="pt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
          <span>Read article</span>
          <ArrowRight class="size-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Card.Root>
  </a>
{/if}

<!-- Articles Grid -->
<div class="grid gap-6 sm:grid-cols-2">
  {#each displayedArticles as article (article.slug)}
    <a href={article.slug} class="group block">
      <Card.Root class="h-full p-6 flex flex-col justify-between transition-colors hover:bg-muted/30">
        <div class="space-y-2.5">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" class="text-xs">
              {article.category}
            </Badge>
            <span>•</span>
            <time>{article.date}</time>
            <span>•</span>
            <span>{article.readTime}</span>
          </div>

          <Card.Title class="text-base sm:text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {article.title}
          </Card.Title>

          <Card.Description class="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {article.excerpt}
          </Card.Description>
        </div>

        <div class="pt-4 flex items-center gap-1 text-xs font-medium text-primary">
          <span>Read</span>
          <ArrowRight class="size-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Card.Root>
    </a>
  {/each}
</div>
