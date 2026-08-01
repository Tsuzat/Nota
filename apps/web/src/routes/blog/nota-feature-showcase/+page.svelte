<script lang="ts">
import { icons } from '@nota/ui/icons';
import { Button } from '@nota/ui/shadcn/button';
import { resolve } from '$app/paths';
import BlogArticleShell from '$lib/components/custom/blog-article-shell.svelte';
import { copyArticleLink } from '$lib/utils/blog';

// --- Interactive Feature Simulator State ---
let activeTab = $state<'slash' | 'mermaid' | 'latex' | 'byok' | 'export'>('slash');

const featureTabs = [
  {
    id: 'slash' as const,
    label: '⚡ Slash Commands',
    title: 'Rich Editor & Multimedia',
  },
  {
    id: 'mermaid' as const,
    label: '📊 Mermaid Diagrams',
    title: 'Visual Flowcharts',
  },
  { id: 'latex' as const, label: '∑ LaTeX Math', title: 'Scientific & Academic' },
  { id: 'byok' as const, label: '🤖 BYOK AI', title: 'Sovereign Intelligence' },
  {
    id: 'export' as const,
    label: '📄 PDF & Export',
    title: 'Zero Vendor Lock-in',
  },
];
</script>

<svelte:head>
  <title>The Ultimate Nota Feature Showcase: Rich Editor, Mermaid, LaTeX, BYOK AI & More</title>
  <meta
    name="description"
    content="Explore Nota's powerhouse features: instantaneous slash commands, embedded Mermaid diagrams, LaTeX math equations, BYOK AI integration, local-first privacy, and professional PDF export."
  />
  <meta
    name="keywords"
    content="Nota features, rich text markdown editor, slash commands note app, Mermaid.js note taking, KaTeX math notes, LaTeX equations editor, BYOK AI note app, wholesale AI text editor, local-first note taking, Rust Tauri notes, PDF note export"
  />
  <meta name="author" content="The Nota Engineering Team" />
  <link rel="canonical" href="https://nota.ink/blog/nota-feature-showcase" />
  <meta property="og:type" content="article" />
  <meta
    property="og:url"
    content="https://nota.ink/blog/nota-feature-showcase"
  />
  <meta
    property="og:title"
    content="The Ultimate Nota Feature Showcase: Rich Editor, Mermaid, LaTeX & BYOK AI"
  />
  <meta
    property="og:description"
    content="A comprehensive deep dive into the features that make Nota the blazing-fast modern standard for thinkers and developers."
  />
  <meta property="og:site_name" content="Nota" />
  <meta property="og:image" content="https://nota.ink/previews/dark.webp" />
  <meta property="article:published_time" content="2026-08-02T00:00:00Z" />
  <meta property="article:modified_time" content="2026-08-02T00:00:00Z" />
  <meta property="article:section" content="Features & Workflow" />
  <meta property="article:author" content="The Nota Engineering Team" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta
    name="twitter:title"
    content="The Ultimate Nota Feature Showcase: Rich Editor, Mermaid, LaTeX & BYOK AI"
  />
  <meta
    name="twitter:description"
    content="Explore Nota's powerhouse features: instantaneous slash commands, embedded Mermaid diagrams, LaTeX math, BYOK AI integration, and local-first speed."
  />
  <meta name="twitter:image" content="https://nota.ink/previews/dark.webp" />

  <!-- Schema.org Article JSON-LD -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://nota.ink/blog/nota-feature-showcase"
      },
      "headline": "The Ultimate Nota Feature Showcase: Rich Editor, Mermaid, LaTeX, BYOK AI & Speed",
      "image": "https://nota.ink/previews/dark.webp",
      "datePublished": "2026-08-02T00:00:00Z",
      "dateModified": "2026-08-02T00:00:00Z",
      "author": {
        "@type": "Organization",
        "name": "The Nota Engineering Team",
        "url": "https://nota.ink"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Nota",
        "logo": {
          "@type": "ImageObject",
          "url": "https://nota.ink/logo.png"
        }
      },
      "description": "An exhaustive feature walkthrough showcasing Nota's slash commands, Mermaid diagrams, KaTeX LaTeX equations, BYOK AI model, PDF export, and native Rust desktop execution."
    }
  </script>
</svelte:head>

<BlogArticleShell
  headerSubtitle="Feature Showcase"
  showHeaderCta={true}
  mainMaxWidth="max-w-4xl"
>
  <!-- Article Header -->
  <header class="mb-10 text-left">
    <div class="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
      <span
        class="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-primary"
      >
        Features & Workflow
      </span>
      <span class="rounded-full bg-muted px-3 py-1 text-muted-foreground">
        10 min read
      </span>
      <span class="text-muted-foreground">• August 2, 2026</span>
    </div>

    <h1
      class="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl text-foreground text-balance leading-[1.15]"
    >
      The Ultimate Nota Feature Showcase: Rich Editor, Mermaid, LaTeX, BYOK AI &
      Rust Speed
    </h1>

    <p
      class="mt-5 text-lg sm:text-xl text-muted-foreground leading-relaxed text-balance"
    >
      Why should modern thinkers choose between barebones plain-text apps and
      cluttered enterprise cloud tools? From instant slash commands and Mermaid
      diagram rendering to sovereign BYOK AI and one-click PDF export, here is a
      complete tour of the features that make Nota built different.
    </p>

    <!-- Author & Social Share -->
    <div
      class="mt-8 flex flex-wrap items-center justify-between gap-4 border-y py-4 text-sm text-muted-foreground"
    >
      <div class="flex items-center gap-3">
        <div class="flex -space-x-2 overflow-hidden">
          <div
            class="size-9 rounded-full bg-linear-to-tr from-primary to-blue-500 flex items-center justify-center font-bold text-white text-xs shadow-sm ring-2 ring-background"
          >
            N
          </div>
          <div
            class="size-9 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm ring-2 ring-background"
          >
            T
          </div>
        </div>
        <div>
          <div class="font-semibold text-foreground">
            Tsuzat & The Nota Engineering Team
          </div>
          <div class="text-xs text-muted-foreground">
            Product & Architecture
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-muted-foreground mr-1">Share:</span>
        <Button
          variant="outline"
          size="icon"
          class="size-8 rounded-full"
          href="https://twitter.com/intent/tweet?text={encodeURIComponent(
            'Explore the incredible powerhouse features inside Nota: Rich text, Mermaid diagrams, LaTeX, BYOK AI & Rust speed!',
          )}&url={encodeURIComponent(
            'https://nota.ink/blog/nota-feature-showcase',
          )}"
          target="_blank"
          title="Share on Twitter / X"
        >
          <icons.Share2 class="size-3.5 text-foreground" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="size-8 rounded-full"
          onclick={copyArticleLink}
          title="Copy Article Link"
        >
          <icons.Link class="size-3.5 text-foreground" />
        </Button>
      </div>
    </div>
  </header>

  <!-- Interactive Feature Simulator Box (WOW Factor!) -->
  <section
    class="my-12 rounded-2xl border-2 border-primary/20 bg-linear-to-b from-card via-card/80 to-background p-6 sm:p-8 shadow-md relative overflow-hidden"
  >
    <div
      class="absolute top-0 right-0 -mt-10 -mr-10 size-40 rounded-full bg-primary/10 blur-3xl pointer-events-none"
    ></div>

    <div class="border-b pb-4 mb-6">
      <span class="text-xs font-extrabold uppercase tracking-wider text-primary"
        >Interactive Feature Preview</span
      >
      <h2 class="text-2xl font-bold tracking-tight text-foreground mt-1">
        Experience the Editor Workspace in Action
      </h2>
      <p class="text-sm text-muted-foreground">
        Click a tab below to test drive Nota's native capabilities:
      </p>
    </div>

    <!-- Tabs Navigation -->
    <div role="tablist" class="flex flex-wrap items-center gap-2 mb-6">
      {#each featureTabs as tab (tab.id)}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border {activeTab ===
          tab.id
            ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'}"
          onclick={() => {
            activeTab = tab.id;
          }}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Simulator Mock Display Screen -->
    <div
      class="relative rounded-xl border bg-background/90 p-6 shadow-inner font-mono text-sm sm:text-base min-h-65 flex flex-col justify-between"
    >
      <div class="absolute top-3 right-3 flex items-center gap-1.5">
        <span class="size-2.5 rounded-full bg-rose-500/80"></span>
        <span class="size-2.5 rounded-full bg-amber-500/80"></span>
        <span class="size-2.5 rounded-full bg-emerald-500/80"></span>
      </div>

      <!-- Content per activeTab -->
      <div class="mt-4 text-foreground font-sans">
        {#if activeTab === "slash"}
          <div class="space-y-3 animate-in fade-in duration-300">
            <div class="text-xs font-semibold text-primary font-mono">
              [Editor Buffer] • Drafting Sprint Notes.md
            </div>
            <p class="text-foreground text-base">
              We need to synthesize the architecture benchmarks before
              tomorrow's review call. Type simply to construct structure:
            </p>
            <div
              class="relative mt-2 p-3 rounded-lg border bg-muted/60 shadow-lg max-w-sm"
            >
              <div
                class="text-xs font-bold text-muted-foreground uppercase mb-2 border-b pb-1"
              >
                ⚡ Slash Command Menu
              </div>
              <div class="space-y-1 text-xs">
                <div
                  class="flex items-center justify-between p-2 rounded bg-primary/20 text-primary font-bold"
                >
                  <span>📊 /table • Insert Data Matrix</span>
                  <span>↵</span>
                </div>
                <div
                  class="flex items-center justify-between p-2 rounded hover:bg-muted text-muted-foreground"
                >
                  <span>🌊 /mermaid • Render Architecture Diagram</span>
                </div>
                <div
                  class="flex items-center justify-between p-2 rounded hover:bg-muted text-muted-foreground"
                >
                  <span>∑ /math • LaTeX Equation Block</span>
                </div>
                <div
                  class="flex items-center justify-between p-2 rounded hover:bg-muted text-muted-foreground"
                >
                  <span>🎥 /embed • YouTube & Audio Clip</span>
                </div>
              </div>
            </div>
          </div>
        {:else if activeTab === "mermaid"}
          <div class="space-y-4 animate-in fade-in duration-300">
            <div class="text-xs font-semibold text-blue-500 font-mono">
              [Mermaid Live Renderer] • Local Vault Engine Architecture
            </div>
            <div
              class="p-5 rounded-xl border bg-muted/30 flex flex-col items-center justify-center text-center"
            >
              <!-- Mock flowchart visually -->
              <div
                class="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold"
              >
                <div
                  class="px-3 py-2 rounded-lg border bg-card text-foreground shadow-xs"
                >
                  💻 User Keystroke
                </div>
                <span class="text-primary font-bold">➔</span>
                <div
                  class="px-3 py-2 rounded-lg border bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                >
                  ⚡ Rust Core Daemon (&lt;50ms)
                </div>
                <span class="text-primary font-bold">➔</span>
                <div
                  class="px-3 py-2 rounded-lg border bg-purple-500/10 text-purple-500 border-purple-500/30"
                >
                  💾 SQLite Local Disk
                </div>
              </div>
              <div class="mt-4 text-[11px] text-muted-foreground">
                ✨ Written in simple syntax: <code
                  class="bg-muted px-1 py-0.5 rounded text-foreground"
                  >graph LR; Keystroke --> RustCore --> SQLite</code
                >
              </div>
            </div>
          </div>
        {:else if activeTab === "latex"}
          <div class="space-y-4 animate-in fade-in duration-300">
            <div class="text-xs font-semibold text-purple-500 font-mono">
              [KaTeX Math Engine] • Navier-Stokes & Tensor Field Equations
            </div>
            <p class="text-muted-foreground text-sm">
              Embed rigorous scientific typography with inline formulas <span
                class="font-serif italic bg-muted px-1.5 py-0.5 rounded text-foreground"
                >E = mc² + ∇ × E</span
              > or standalone multi-line proof blocks:
            </p>
            <div
              class="p-6 rounded-xl border bg-card text-center font-serif text-lg sm:text-xl tracking-wider text-foreground shadow-inner"
            >
              ∫<sub>0</sub><sup>∞</sup> e<sup>-x²</sup> dx = √π / 2
            </div>
            <div
              class="text-[11px] font-mono text-muted-foreground text-center"
            >
              LaTeX source: <code class="bg-muted px-1 py-0.5 rounded"
                >\int_0^\infty e^&#123;-x^2&#125; dx =
                \frac&#123;\sqrt&#123;\pi&#125;&#125;&#123;2&#125;</code
              >
            </div>
          </div>
        {:else if activeTab === "byok"}
          <div class="space-y-4 animate-in fade-in duration-300">
            <div class="text-xs font-semibold text-emerald-500 font-mono">
              [Sovereign AI Config] • Bring Your Own Key (BYOK)
            </div>
            <div class="p-4 rounded-xl border bg-muted/30 space-y-3 max-w-md">
              <div
                class="flex items-center justify-between text-xs font-bold text-foreground"
              >
                <span>Active Provider: Anthropic Claude 3.5 Sonnet</span>
                <span
                  class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px]"
                  >Encrypted on Disk</span
                >
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="password"
                  value="sk-ant-api03-2948729834792348-nota-secret"
                  disabled
                  class="w-full bg-background border rounded px-3 py-1.5 text-xs font-mono text-muted-foreground"
                />
              </div>
              <p class="text-[11px] text-muted-foreground">
                💡 <strong class="text-foreground">Zero markup tax:</strong> You
                pay exact wholesale per-token rates (~$0.20/month for average weekly
                summaries) directly to AI providers without $10/mo SaaS add-ons.
              </p>
            </div>
          </div>
        {:else if activeTab === "export"}
          <div class="space-y-4 animate-in fade-in duration-300">
            <div class="text-xs font-semibold text-amber-500 font-mono">
              [Export & Portability Engine] • Absolute Data Ownership
            </div>
            <div class="grid gap-3 sm:grid-cols-3 pt-2">
              <div
                class="p-4 rounded-xl border bg-card flex flex-col items-center text-center shadow-xs hover:border-primary/40 transition-all"
              >
                <span class="text-2xl">📄</span>
                <span class="mt-2 font-bold text-sm text-foreground"
                  >Print to PDF</span
                >
                <span class="mt-1 text-[11px] text-muted-foreground"
                  >Clean typography formatting with page headers & footers.</span
                >
              </div>
              <div
                class="p-4 rounded-xl border bg-card flex flex-col items-center text-center shadow-xs hover:border-primary/40 transition-all"
              >
                <span class="text-2xl">📝</span>
                <span class="mt-2 font-bold text-sm text-foreground"
                  >Plain Markdown</span
                >
                <span class="mt-1 text-[11px] text-muted-foreground"
                  >100% interoperable files compatible with Obsidian or Jekyll.</span
                >
              </div>
              <div
                class="p-4 rounded-xl border bg-card flex flex-col items-center text-center shadow-xs hover:border-primary/40 transition-all"
              >
                <span class="text-2xl">⚡</span>
                <span class="mt-2 font-bold text-sm text-foreground"
                  >JSON & Snapshots</span
                >
                <span class="mt-1 text-[11px] text-muted-foreground"
                  >Full transactional database snapshot dumps for long-term
                  vaulting.</span
                >
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div
        class="mt-6 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between font-sans"
      >
        <span
          >✅ Available immediately on both macOS/Windows/Linux Desktop & Web
          App</span
        >
        <span class="font-semibold text-primary">Zero Setup Required</span>
      </div>
    </div>
  </section>

  <!-- Article Content -->
  <article
    class="prose prose-neutral dark:prose-invert max-w-none space-y-12 text-base sm:text-lg leading-relaxed"
  >
    <!-- Section 1: Editor & Slash Commands -->
    <section>
      <h2
        class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl border-b pb-3"
      >
        1. The Next-Gen Rich Text Editor & Slash Commands
      </h2>
      <p>
        At the core of any productivity application is the writing interface.
        Too many modern note tools fall into two frustrating extremes: rigid
        plain-text Markdown editors that require toggling between raw syntax and
        preview windows, or sluggish web editors that fight your cursor every
        time you press enter.
      </p>
      <p>
        Nota is powered by a custom-engineered high-performance <strong
          >Tiptap rendering engine</strong
        > that renders formatting instantly as you type. You get the tactile satisfaction
        of Markdown shortcuts without the visual clutter of syntax hash symbols.
      </p>
      <blockquote
        class="border-l-4 border-primary pl-4 italic my-6 bg-muted/30 p-4 rounded-r-lg text-foreground font-medium"
      >
        "Don't reach for your mouse just to create a table or highlight a key
        takeaway. Pressing <code>/</code> instantly unlocks Nota's command toolset."
      </blockquote>
      <div class="my-6 grid gap-4 sm:grid-cols-2 text-sm">
        <div class="rounded-xl border bg-card p-4 shadow-xs">
          <div class="font-bold text-foreground mb-1">
            📋 Interactive Data Tables
          </div>
          <p class="text-muted-foreground text-xs">
            Generate resizable rows and columns on the fly. Format cells, align
            headers, and structure complex sprint schedules without wrestling
            with Markdown pipe alignment.
          </p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-xs">
          <div class="font-bold text-foreground mb-1">
            🎥 Embedded Multimedia
          </div>
          <p class="text-muted-foreground text-xs">
            Embed responsive YouTube video lectures, SoundCloud audio tracks,
            external web articles, and dynamic imagery directly within your
            project documents.
          </p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-xs">
          <div class="font-bold text-foreground mb-1">
            💡 Callouts & Highlight Admonitions
          </div>
          <p class="text-muted-foreground text-xs">
            Draw immediate attention to critical warnings, Pro-tips, bug
            notices, and executive takeaways using color-coded callout boxes.
          </p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-xs">
          <div class="font-bold text-foreground mb-1">
            💻 Syntax-Highlighted Code Blocks
          </div>
          <p class="text-muted-foreground text-xs">
            Write clean code snippets across dozens of programming languages
            with full line numbering, theme support, and one-click copy buttons.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 2: Mermaid & LaTeX -->
    <section>
      <h2
        class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl border-b pb-3"
      >
        2. Built for Technical Thinkers: Mermaid Diagrams & LaTeX Math
      </h2>
      <p>
        Whether you are software architect sketching microservice authentication
        workflows or an engineering researcher calculating partial
        differentials, textual notes alone rarely suffice. While competing
        software forces you to subscribe to external UI drawing suites or
        assemble fragile third-party community plugins just to render a basic
        flowchart, Nota builds native visual syntax directly into the document
        pipeline.
      </p>
      <h3 class="text-xl font-bold text-foreground mt-6">
        Native Mermaid.js Diagramming
      </h3>
      <p>
        With native <strong>Mermaid.js integration</strong>, you can transform
        simple text blocks into dynamic flowcharts, state diagrams,
        entity-relationship models, Gantt schedules, and sequence diagrams. When
        you share or export your note, diagrams render crisply as vector
        graphics—ensuring zero pixilation regardless of screen zoom.
      </p>
      <h3 class="text-xl font-bold text-foreground mt-6">
        KaTeX & LaTeX Mathematical Equations
      </h3>
      <p>
        For academic and scientific rigor, Nota fully integrates a low-latency <strong
          >KaTeX equation compiler</strong
        >. Wrap formulas in simple `$$` symbols to render complex integrals,
        matrices, fractions, and Greek notation in classic publication-grade
        typography. Whether drafting machine learning lecture notes or quantum
        mechanics hypotheses, equations evaluate in real-time without delaying
        typing responsiveness.
      </p>
    </section>

    <!-- Section 3: BYOK AI -->
    <section>
      <h2
        class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl border-b pb-3"
      >
        3. Sovereign Intelligence: Bring Your Own Key (BYOK) AI
      </h2>
      <p>
        Artificial intelligence has become an indispensable companion for
        brainstorming outlines, summarizing lengthy transcripts, and expanding
        rough conversational ideas into polished documentation. However, legacy
        note suites have treated AI as a revenue grab—slapping $10 to $15
        monthly recurring surcharge fees per user simply to communicate with
        standard external models.
      </p>
      <p>
        Nota flips the economics of AI note-taking via our <strong
          >Bring Your Own Key (BYOK)</strong
        > architecture:
      </p>
      <ul class="space-y-3 list-disc pl-6 text-foreground/90">
        <li>
          <strong>Wholesale Token Pricing:</strong> Connect your private developer
          credentials from OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), or Google
          Gemini. Pay exact literal per-token server costs—typically costing under
          $0.50 for an entire month of intense writing.
        </li>
        <li>
          <strong>Unmatched Data Privacy:</strong> Your proprietary notes and prompts
          travel directly from your local encrypted disk storage to the AI provider
          without intermediary logging on advertising aggregation servers.
        </li>
        <li>
          <strong>Bundled Pro Credits for Simplicity:</strong> For users who prefer
          instant convenience without configuring developer accounts, Nota Pro includes
          generous pre-bundled AI credits ready immediately upon signing in.
        </li>
      </ul>
    </section>

    <!-- Section 4: Rust Speed & Universal Access -->
    <section>
      <h2
        class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl border-b pb-3"
      >
        4. Blazing Rust Speed, Local-First Privacy & Web Parity
      </h2>
      <p>
        Why do so many note apps feel heavy, slow, and resource-hungry? Because
        most mainstream tools—including Notion and Obsidian—are built on top of
        Electron, bundling an entire redundant Google Chrome web browser inside
        your desktop binaries.
      </p>
      <p>
        Nota's native desktop core is forged with <strong>Rust and Tauri</strong
        >. By harnessing your operating system's native webview and handling
        intensive file IO, SQLite queries, and encryption inside high-speed Rust
        background threads, Nota delivers startling performance statistics:
      </p>

      <div class="my-8 grid gap-4 sm:grid-cols-3">
        <div class="rounded-xl border bg-card p-5 text-center shadow-xs">
          <div class="text-xs font-bold text-muted-foreground uppercase">
            Launch Speed
          </div>
          <div class="mt-2 text-3xl font-black text-emerald-500">
            &lt; 50 ms
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            Opens instantly before your train of thought escapes
          </p>
        </div>
        <div class="rounded-xl border bg-card p-5 text-center shadow-xs">
          <div class="text-xs font-bold text-muted-foreground uppercase">
            RAM Consumption
          </div>
          <div class="mt-2 text-3xl font-black text-primary">~45 MB</div>
          <p class="mt-1 text-xs text-muted-foreground">
            80% lighter memory footprint than typical Electron apps
          </p>
        </div>
        <div class="rounded-xl border bg-card p-5 text-center shadow-xs">
          <div class="text-xs font-bold text-muted-foreground uppercase">
            Offline Freedom
          </div>
          <div class="mt-2 text-3xl font-black text-blue-500">100% Local</div>
          <p class="mt-1 text-xs text-muted-foreground">
            Device SQLite storage by default with optional cloud sync
          </p>
        </div>
      </div>

      <p>
        Best of all, you never sacrifice accessibility for speed. Whether
        running our native Tauri app on macOS, Windows, or Linux, or signing
        into our <strong>identical high-velocity Web App</strong> on a Chromebook
        or work computer, your notes, slash commands, and visual formatting work
        seamlessly across every digital screen.
      </p>
    </section>

    <!-- Section 5: PDF Export, Versioning & Zero Lock-in -->
    <section>
      <h2
        class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl border-b pb-3"
      >
        5. Absolute Data Ownership: PDF Export, Versioning & Zero Lock-In
      </h2>
      <p>
        We believe deeply in a fundamental tenet of software craftsmanship: <strong
          >your thoughts belong to you, forever</strong
        >. You should never feel trapped within a proprietary database or worry
        that canceling a subscription will corrupt your writing archive.
      </p>
      <h3 class="text-xl font-bold text-foreground mt-6">
        Professional PDF Document Export
      </h3>
      <p>
        When it is time to deliver your final meeting report, academic
        dissertation, or project proposal, Nota generates cleanly formatted,
        professional <strong>PDF documents</strong> directly from your notes with
        a single click—complete with high-resolution Mermaid vector diagrams, formatted
        mathematical equations, and tailored typography margins.
      </p>
      <h3 class="text-xl font-bold text-foreground mt-6">
        Resilient Local & Cloud Snapshot Restoration
      </h3>
      <p>
        Mistakes happen. If a team member mistakenly deletes a crucial section
        of a shared cloud document, Nota's hybrid snapshot engine ensures zero
        panic. Every note maintains granular version histories across both
        device disk storage and cloud backups. You can instantly revert and
        restore even massive 100,000-word manuscripts directly from client local
        snapshots—ensuring total fail-proof resilience.
      </p>
    </section>

    <!-- Summary Box -->
    <section class="rounded-2xl border bg-muted/20 p-8 my-12">
      <h2
        class="text-2xl font-black tracking-tight text-foreground sm:text-3xl mt-0 mb-4"
      >
        Summary: The Nota Feature Checklist
      </h2>
      <div
        class="grid gap-3 sm:grid-cols-2 text-sm text-foreground/90 font-medium pt-2"
      >
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>Sub-50ms native Rust & Tauri launch speed</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>Zero setup Tiptap rich editor & slash commands</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>Native Mermaid.js flowchart visualizer</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>KaTeX & LaTeX scientific equation compiler</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>Sovereign BYOK AI (OpenAI, Claude, Gemini)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>100% Local-first disk privacy by default</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>One-click professional PDF document export</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✔</span>
          <span>Full parity across macOS, Windows, Linux & Web</span>
        </div>
      </div>
    </section>
  </article>

  <!-- Final Call to Action Box -->
  <section
    class="mt-16 rounded-2xl border bg-linear-to-br from-primary/10 via-card to-background p-8 sm:p-12 text-center shadow-lg relative overflow-hidden"
  >
    <div class="relative z-10 max-w-2xl mx-auto">
      <h2
        class="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground"
      >
        Upgrade to a Note Engine Actually Built for Flow
      </h2>
      <p class="mt-4 text-muted-foreground text-sm sm:text-base text-balance">
        Start building your personal library today. Enjoy unlimited local
        workspaces for free on desktop or browser—no credit cards or
        subscription traps required.
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button
          size="lg"
          href={resolve("/#pricing")}
          class="rounded-full px-8 font-bold text-base shadow-md"
        >
          Download & Try Free
        </Button>
        <Button
          variant="outline"
          size="lg"
          href={resolve("/blog")}
          class="rounded-full gap-2 font-semibold"
        >
          <span>Explore More Articles</span>
          <icons.ArrowRight class="size-4" />
        </Button>
      </div>
    </div>
  </section>
</BlogArticleShell>
