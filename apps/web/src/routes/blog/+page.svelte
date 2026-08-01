<script lang="ts">
import ToggleMode from '@nota/ui/custom/ToggleMode.svelte';
import { icons } from '@nota/ui/icons';
import { Button } from '@nota/ui/shadcn/button';
import { resolve } from '$app/paths';
import AppLogo from '$lib/components/custom/applogo.svelte';
import Particles from '$lib/components/custom/landing/particles.svelte';

const featuredArticle = {
  slug: 'nota-vs-notion-vs-obsidian',
  title: 'Nota vs. Notion vs. Obsidian vs. Evernote: The 2026 Note-Taking Showdown',
  excerpt:
    "Are you trapped between Notion's cloud lock-in and sluggish Electron loading screens, or overwhelmed by assembling 30+ Obsidian community plugins just to sync across devices? Discover why thousands of modern developers, writers, and thinkers are switching to Nota—the blazing-fast, Rust-powered hybrid note engine.",
  category: 'Showdown & Comparison',
  readTime: '12 min read',
  date: 'August 1, 2026',
  author: 'Tsuzat & The Nota Engineering Team',
  badge: 'Must Read',
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  badge?: string;
}

const articles: BlogPost[] = [
  {
    slug: 'nota-feature-showcase',
    title: 'The Ultimate Nota Feature Showcase: Rich Editor, Mermaid, LaTeX, BYOK AI & Rust Speed',
    excerpt:
      'Why should modern thinkers choose between barebones plain-text apps and cluttered enterprise cloud tools? From instant slash commands and Mermaid diagram rendering to sovereign BYOK AI and one-click PDF export, discover why Nota is built different.',
    category: 'Features & Workflow',
    readTime: '10 min read',
    date: 'August 2, 2026',
    badge: 'New Feature Guide',
  },
  {
    slug: 'rust-and-tauri-vs-electron',
    title: 'Why We Built Nota with Rust and Tauri Instead of Electron',
    excerpt:
      'Electron apps devour RAM and drain laptop battery life. Learn how building our desktop core with Rust and Tauri cut memory usage by 80% while achieving instantaneous Raycast-style cold starts.',
    category: 'Architecture & Performance',
    readTime: '6 min read',
    date: 'July 24, 2026',
  },
  {
    slug: 'byok-ai-note-taking',
    title: 'Bring Your Own Key (BYOK): Ending Overpriced AI Subscription Taxes',
    excerpt:
      'Why are note apps charging $10/month extra for simple wrapper AI assistants? How Nota lets you plug in your OpenAI, Anthropic, or Gemini keys to summarize and write practically at cost.',
    category: 'AI & Freedom',
    readTime: '5 min read',
    date: 'July 15, 2026',
  },
  {
    slug: 'local-first-hybrid-engine',
    title: 'Local-First Without the Complexity: Inside Nota’s Hybrid Engine',
    excerpt:
      'You should never have to set up Git sync hooks or worry about losing access to your thoughts when AWS has an outage. Here is how Nota balances SQLite device-local vaults with seamless real-time cloud workspaces.',
    category: 'Philosophy & Engineering',
    readTime: '8 min read',
    date: 'July 2, 2026',
  },
];

let selectedCategory = $state('All');
const categories = [
  'All',
  'Showdown & Comparison',
  'Features & Workflow',
  'Architecture & Performance',
  'AI & Freedom',
  'Philosophy & Engineering',
];

const displayedArticles = $derived(
  selectedCategory === 'All' ? articles : articles.filter((a) => a.category === selectedCategory)
);
</script>

<svelte:head>
  <title>Blog & Insights | Nota — Fast, Local-First Note-Taking & AI Workspace</title>
  <meta
    name="description"
    content="Explore authoritative engineering deep dives on Rust and Tauri, side-by-side app showdowns against Notion and Obsidian, and local-first BYOK AI productivity guides."
  />
  <meta
    name="keywords"
    content="Nota blog, note-taking app comparison, Notion alternative, Obsidian alternative, Rust desktop app, local-first note app, BYOK AI note app, Tauri notes, Markdown rich text editor, privacy first productivity"
  />
  <meta name="author" content="The Nota Engineering Team" />
  <link rel="canonical" href="https://nota.ink/blog" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://nota.ink/blog" />
  <meta
    property="og:title"
    content="Blog & Insights | Nota — Fast, Local-First Note-Taking"
  />
  <meta
    property="og:description"
    content="Explore authoritative engineering deep dives on Rust and Tauri, app showdowns against Notion and Obsidian, and modern BYOK AI productivity guides."
  />
  <meta property="og:site_name" content="Nota" />
  <meta property="og:image" content="https://nota.ink/previews/dark.webp" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta
    name="twitter:title"
    content="Blog & Insights | Nota — Fast, Local-First Note-Taking"
  />
  <meta
    name="twitter:description"
    content="Explore authoritative engineering deep dives on Rust and Tauri, app showdowns against Notion and Obsidian, and modern BYOK AI productivity guides."
  />
  <meta name="twitter:image" content="https://nota.ink/previews/dark.webp" />

  <!-- Schema.org Blog Portal & ItemList JSON-LD -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Nota Blog & Insights",
      "url": "https://nota.ink/blog",
      "description": "Insights, engineering architecture, and comparative analyses on modern note-taking apps and sovereign AI workflows.",
      "publisher": {
        "@type": "Organization",
        "name": "Nota",
        "url": "https://nota.ink",
        "logo": {
          "@type": "ImageObject",
          "url": "https://nota.ink/logo.png"
        }
      },
      "blogPost": [
        {
          "@type": "BlogPosting",
          "headline": "The Ultimate Nota Feature Showcase: Rich Editor, Mermaid, LaTeX, BYOK AI & Rust Speed",
          "url": "https://nota.ink/blog/nota-feature-showcase",
          "datePublished": "2026-08-02T00:00:00Z",
          "description": "An exhaustive walkthrough of Nota's native feature set: slash commands, Mermaid diagrams, KaTeX equations, BYOK AI, and PDF export."
        },
        {
          "@type": "BlogPosting",
          "headline": "Nota vs. Notion vs. Obsidian vs. Evernote: The 2026 Note-Taking Showdown",
          "url": "https://nota.ink/blog/nota-vs-notion-vs-obsidian",
          "datePublished": "2026-08-01T00:00:00Z",
          "description": "Discover why modern thinkers are ditching slow Electron cloud apps and messy community plugins for Nota."
        },
        {
          "@type": "BlogPosting",
          "headline": "Why We Built Nota with Rust and Tauri Instead of Electron",
          "url": "https://nota.ink/blog/rust-and-tauri-vs-electron",
          "datePublished": "2026-07-24T00:00:00Z",
          "description": "Learn how building our desktop core with Rust and Tauri cut memory usage by 80% with instant cold starts."
        },
        {
          "@type": "BlogPosting",
          "headline": "Bring Your Own Key (BYOK): Ending Overpriced AI Subscription Taxes",
          "url": "https://nota.ink/blog/byok-ai-note-taking",
          "datePublished": "2026-07-15T00:00:00Z",
          "description": "How Nota lets you plug in OpenAI, Anthropic, or Gemini keys to summarize and write directly at wholesale token cost."
        },
        {
          "@type": "BlogPosting",
          "headline": "Local-First Without the Complexity: Inside Nota’s Hybrid Engine",
          "url": "https://nota.ink/blog/local-first-hybrid-engine",
          "datePublished": "2026-07-02T00:00:00Z",
          "description": "How Nota balances SQLite device-local storage vaults with seamless real-time cloud workspaces."
        }
      ]
    }
  </script>
</svelte:head>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />

<header
  class="sticky top-0 z-50 mx-auto flex max-w-6xl items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8"
>
  <div class="flex items-center gap-4">
    <AppLogo />
    <span
      class="border-l pl-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase hidden sm:inline-block"
    >
      Blog & Insights
    </span>
  </div>
  <div class="flex items-center gap-3">
    <Button
      variant="ghost"
      size="sm"
      href={resolve("/")}
      class="gap-2 text-xs md:text-sm font-medium"
    >
      <icons.ArrowLeft class="size-4" />
      <span>Back to Home</span>
    </Button>
    <ToggleMode />
    <Button
      variant="default"
      size="sm"
      href={resolve("/#pricing")}
      class="hidden rounded-full font-semibold sm:inline-flex"
    >
      Get Nota Free
    </Button>
  </div>
</header>

<main class="mx-auto max-w-6xl px-4 py-12 sm:px-8">
  <!-- Hero Heading -->
  <div class="mb-12 max-w-3xl text-left">
    <div
      class="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold text-primary mb-4"
    >
      <icons.Sparkles class="size-3.5" />
      <span>Thinking in Flow & Speed</span>
    </div>
    <h1
      class="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-balance"
    >
      Nota Blog & Resources
    </h1>
    <p class="mt-4 text-lg text-muted-foreground text-balance leading-relaxed">
      Deep dives into local-first software architecture, native desktop
      performance with Rust, zero lock-in writing workflows, and unbiased tools
      comparisons.
    </p>
  </div>

  <!-- Category Filters -->
  <div role="tablist" aria-label="Blog Category Filters" class="mb-10 flex flex-wrap items-center gap-2 border-b pb-6">
    {#each categories as cat (cat)}
      <Button
        role="tab"
        aria-selected={selectedCategory === cat}
        variant={selectedCategory === cat ? "default" : "outline"}
        size="sm"
        class="rounded-full px-4 text-xs font-medium transition-all"
        onclick={() => {
          selectedCategory = cat;
        }}
      >
        {cat}
      </Button>
    {/each}
  </div>

  <!-- Featured Article (Always prominent unless filtered out) -->
  {#if selectedCategory === "All" || selectedCategory === featuredArticle.category}
    <div class="mb-14">
      <a
        href={resolve(`/blog/${featuredArticle.slug}`)}
        class="group relative block overflow-hidden rounded-2xl border bg-linear-to-br from-card via-card to-muted/30 p-1 transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-primary/50"
      >
        <div
          class="absolute inset-0 z-0 bg-linear-to-r from-primary/10 via-transparent to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        ></div>

        <div
          class="relative z-10 grid gap-6 p-6 sm:p-10 md:grid-cols-12 md:items-center"
        >
          <div class="md:col-span-7 flex flex-col justify-between space-y-4">
            <div
              class="flex flex-wrap items-center gap-2.5 text-xs font-semibold"
            >
              <span
                class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-primary-foreground shadow-xs"
              >
                <icons.Sparkles class="size-3.5 text-primary-foreground" />
                {featuredArticle.badge}
              </span>
              <span
                class="inline-flex items-center whitespace-nowrap rounded-full border border-border/50 bg-muted/80 px-3 py-1 text-muted-foreground"
              >
                {featuredArticle.category}
              </span>
              <span class="text-muted-foreground/40">•</span>
              <span class="whitespace-nowrap text-muted-foreground font-medium"
                >{featuredArticle.readTime}</span
              >
            </div>

            <h2
              class="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl group-hover:text-primary transition-colors text-balance"
            >
              {featuredArticle.title}
            </h2>

            <p
              class="text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-3"
            >
              {featuredArticle.excerpt}
            </p>

            <div
              class="flex items-center gap-3 pt-2 text-xs text-muted-foreground font-medium"
            >
              <span class="text-foreground">{featuredArticle.author}</span>
              <span>—</span>
              <time>{featuredArticle.date}</time>
            </div>
          </div>

          <!-- Decorative Graphic Box -->
          <div class="md:col-span-5 flex items-center justify-center p-4">
            <div
              class="relative w-full aspect-video md:aspect-square rounded-xl bg-linear-to-tr from-muted to-background border p-6 flex flex-col items-center justify-center text-center shadow-inner overflow-hidden"
            >
              <div
                class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[16px_16px]"
              ></div>

              <div class="relative z-10 flex flex-col items-center gap-4">
                <div class="flex items-center justify-center gap-3">
                  <!-- Nota Badge -->
                  <div
                    class="flex flex-col items-center p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-md transform -rotate-6 transition-transform group-hover:-rotate-12"
                  >
                    <icons.Zap class="size-8 text-primary" />
                    <span class="mt-1 text-xs font-bold text-foreground"
                      >Nota</span
                    >
                  </div>
                  <!-- VS -->
                  <span
                    class="text-lg font-black italic text-muted-foreground/60"
                    >VS</span
                  >
                  <!-- Giants -->
                  <div
                    class="flex flex-col items-center p-3 rounded-xl bg-muted/80 border transform rotate-6 transition-transform group-hover:rotate-12"
                  >
                    <icons.FolderLock class="size-8 text-muted-foreground" />
                    <span
                      class="mt-1 text-xs font-semibold text-muted-foreground"
                      >The Bloated Giants</span
                    >
                  </div>
                </div>

                <div
                  class="inline-flex items-center gap-2 rounded-full border bg-background/90 px-4 py-1.5 text-xs font-semibold shadow-xs"
                >
                  <span>Read the Full Showdown</span>
                  <icons.ArrowUpRight
                    class="size-3.5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  {/if}

  <!-- Articles Grid -->
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {#each displayedArticles as article (article.slug)}
      <a
        href={resolve(`/blog/${article.slug}`)}
        class="group flex flex-col justify-between rounded-xl border bg-card/60 p-6 backdrop-blur-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-lg"
      >
        <div>
          <div class="mb-3.5 flex flex-wrap items-center gap-2">
            {#if article.badge}
              <span
                class="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-primary shadow-xs"
              >
                <icons.Sparkles class="size-3 text-primary" />
                {article.badge}
              </span>
            {/if}
            <span
              class="inline-flex items-center whitespace-nowrap rounded-full border border-border/50 bg-muted/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors group-hover:border-border group-hover:text-foreground"
            >
              {article.category}
            </span>
          </div>

          <h3
            class="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2"
          >
            {article.title}
          </h3>

          <p
            class="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3"
          >
            {article.excerpt}
          </p>
        </div>

        <div
          class="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-xs font-medium text-muted-foreground"
        >
          <div class="flex items-center gap-2">
            <time>{article.date}</time>
            <span class="text-muted-foreground/40">•</span>
            <span class="whitespace-nowrap">{article.readTime}</span>
          </div>
          <span
            class="inline-flex items-center gap-1 font-semibold text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
          >
            <span class="hidden xl:inline">Read</span>
            <icons.ArrowRight class="size-4" />
          </span>
        </div>
      </a>
    {:else}
      <div class="col-span-full py-16 text-center text-muted-foreground border rounded-xl bg-card/20">
        <p class="text-base font-semibold">No articles found in this category.</p>
        <p class="mt-1 text-sm">Check back soon as our technical writing library continues to grow!</p>
      </div>
    {/each}
  </div>

  <!-- Bottom Newsletter & CTA Section -->
  <section
    class="mt-24 rounded-2xl border bg-linear-to-br from-card via-background to-primary/5 p-8 sm:p-12 text-center shadow-sm"
  >
    <div class="mx-auto max-w-2xl">
      <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
        Experience Note-Taking at the Speed of Thought
      </h2>
      <p class="mt-3 text-muted-foreground text-sm sm:text-base text-balance">
        No credit cards required. No recurring AI subscription traps. Download
        the desktop app powered by Rust or open the web app instantly.
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          href={resolve("/#pricing")}
          class="rounded-full px-8 font-semibold shadow-md"
        >
          Start for Free
        </Button>
        <Button
          variant="outline"
          size="lg"
          href="https://github.com/Tsuzat/Nota"
          target="_blank"
          class="rounded-full gap-2 font-medium"
        >
          <icons.Github class="size-4" />
          <span>Star on GitHub</span>
        </Button>
      </div>
    </div>
  </section>
</main>

<footer class="mt-16 border-t py-6 text-center text-sm text-muted-foreground">
  <div
    class="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 sm:justify-between"
  >
    <div class="flex items-center gap-2">
      <span>© 2026 Nota. Built with Svelte & Rust.</span>
    </div>
    <div class="flex items-center gap-4 text-xs">
      <a href={resolve("/terms")} class="hover:text-primary transition-colors"
        >Terms of Use</a
      >
      <span>•</span>
      <a href={resolve("/privacy")} class="hover:text-primary transition-colors"
        >Privacy Policy</a
      >
      <span>•</span>
      <a
        href="mailto:contact@nota.ink"
        class="hover:text-primary transition-colors">Contact Us</a
      >
    </div>
  </div>
</footer>
