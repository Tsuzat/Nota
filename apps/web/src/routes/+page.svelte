<script lang="ts">
import ArrowRight from "@lucide/svelte/icons/arrow-right";
import Bot from "@lucide/svelte/icons/bot";
import Check from "@lucide/svelte/icons/check";
import Copy from "@lucide/svelte/icons/copy";
import Database from "@lucide/svelte/icons/database";
import Download from "@lucide/svelte/icons/download";
import FolderLock from "@lucide/svelte/icons/folder-lock";
import Menu from "@lucide/svelte/icons/menu";
import Pencil from "@lucide/svelte/icons/pencil";
import Sparkles from "@lucide/svelte/icons/sparkles";
import Zap from "@lucide/svelte/icons/zap";
import { ToggleMode } from "@nota/ui/custom/index.js";
import UserAvatar from "@nota/ui/custom/user-avarar.svelte";
import { BarSpinner } from "@nota/ui/icons/index.js";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@nota/ui/shadcn/accordion/index.js";
import { Button, buttonVariants } from "@nota/ui/shadcn/button/index.ts";
import * as Dropdown from "@nota/ui/shadcn/dropdown-menu/index.ts";
import { cn } from "@nota/ui/utils";
import { onMount } from "svelte";
import { fade } from "svelte/transition";
import ArtifactDownloader from "#components/artefact/artifact-downloader.svelte";
import AppLogo from "#components/custom/app-logo.svelte";
import BorderBeam from "#components/custom/landing/border-beam.svelte";
import Multistream from "#components/custom/landing/multistream.svelte";
import Particles from "#components/custom/landing/particles.svelte";
import { Pricing } from "#components/custom/landing/pricing/index.ts";
import Spotlight from "#components/custom/landing/spotlight.svelte";
import Tiltcard from "#components/custom/tilt-card.svelte";
import { authClient } from "#lib/auth-client.ts";
import { handleSignout } from "#lib/utils.ts";
import { resolve } from "$app/paths";
import { getArtefacts } from "./data.remote";

const sessionQuery = authClient.useSession();

let y = $state(0);
let isScrolled = $derived(y > 20);
const tabItems = [
	{
		url: "#features",
		title: "Features",
	},
	{
		url: "#solutions",
		title: "Solution",
	},
	{
		url: "#pricing",
		title: "Pricing",
	},
	{
		url: "#faqs",
		title: "FAQs",
	},
	{
		url: "/blog",
		title: "Blog",
	},
];

const features = [
	{
		name: "Rich Text Editor",
		description:
			"Powered by a custom editor with support for slash commands, markdown shortcuts, media embeds, and mathematical equations.",
		icon: Pencil,
	},
	{
		name: "AI Integration",
		description:
			"Built-in AI assistant for text generation and summarization with a Bring Your Own Key (BYOK) model to keep costs down.",
		icon: Bot,
	},
	{
		name: "Cross-Platform & Fast",
		description:
			"Available as a lightweight Desktop app built with Rust (Tauri) and on the Web with the same blazingly fast, responsive performance.",
		icon: Zap,
	},
	{
		name: "Secure & Organized",
		description:
			"Manage your notes with hierarchical workspaces. Protected by custom authentication flow and session management.",
		icon: FolderLock,
	},
	{
		name: "Multi-Format Export",
		description:
			"Export your notes anytime to PDF, JSON, HTML, and Markdown to maintain complete ownership of your data with zero vendor lock-in.",
		icon: Download,
	},
	{
		name: "Local-First & Offline",
		description:
			"Built on a robust device-local SQLite and filesystem architecture. Your notes remain instantaneous and accessible offline without internet.",
		icon: Database,
	},
];

const faqItems = [
	{
		id: "item-1",
		question: "What makes Nota different from typical Electron note apps?",
		answer:
			"Nota is built natively with Tauri and Rust, making it blindingly fast, lightweight, and memory-efficient. You enjoy an expressive rich text editing experience without the sluggish performance or system resource bloat of standard desktop applications on macOS, Windows, Linux, and Web.",
		category: "General",
	},
	{
		id: "item-2",
		question: "Is Nota free for local-first users?",
		answer:
			"Yes! Our Free tier is tailored for local-first workflows, offering unlimited local notes and workspaces stored directly on your disk. You also receive 1 cloud workspace with up to 5 cloud notes completely free.",
		category: "Pricing",
	},
	{
		id: "item-3",
		question: "How does version history and snapshot restoration work?",
		answer:
			"Nota automatically preserves checkpoints of your writing as you edit. Local notes save snapshots directly to your disk, while Pro users on cloud workspaces maintain both cloud and local backups—enabling seamless content restoration across devices even for massive 100,000+ word documents.",
		category: "Features",
	},
	{
		id: "item-4",
		question: "How does the Bring Your Own Key (BYOK) AI model work?",
		answer:
			"Instead of paying expensive recurring AI subscription add-ons, Nota lets you connect your personal API keys (OpenAI, Anthropic, Google, etc.) to generate text, rephrase paragraphs, and summarize documents practically at cost. Pro subscribers also enjoy bundled AI credits ready out of the box.",
		category: "Features",
	},
	{
		id: "item-5",
		question: "What is the difference between the Free and Pro plans?",
		answer:
			"The Free plan unlocks unlimited local note creation, device-local media storage, and limited cloud syncing (1 workspace, 5 notes). Pro upgrades you to unlimited cloud notes and workspaces, 5 GB of cloud media storage, realtime teamwork collaboration, browser web access, advanced versioning, and AI credits.",
		category: "Pricing",
	},
	{
		id: "item-6",
		question: "Can I reliably work totally offline?",
		answer:
			"Absolutely! Because Nota relies on a robust local-first SQLite and filesystem architecture via Tauri, your notes remain instantaneous and fully accessible on your desktop regardless of your internet connection.",
		category: "General",
	},
	{
		id: "item-7",
		question: "What capabilities does the rich text editor offer?",
		answer:
			"Our high-speed custom Tiptap editor seamlessly supports markdown shortcuts, rapid slash commands (/), drag-and-drop media embeds (images, video, audio), LaTeX mathematical formulas, interactive task checklists, code blocks, and dynamic tables.",
		category: "Features",
	},
	{
		id: "item-8",
		question: "How secure is my personal writing and data?",
		answer:
			"We treat your privacy with rigorous respect. Your local workspaces never touch our servers. For cloud features, data is transferred with robust encryption, secured by modern authentication protocols, and tenant-isolated in state-of-the-art databases.",
		category: "Security",
	},
	{
		id: "item-9",
		question: "Can I export my notes to avoid lock-in?",
		answer:
			"Yes! We believe your writing belongs solely to you. Nota provides seamless export capabilities to PDF, JSON, HTML, and Markdown document formats at any time, guaranteeing zero vendor lock-in.",
		category: "General",
	},
	{
		id: "item-10",
		question: "Can I upgrade, downgrade, or cancel my subscription anytime?",
		answer:
			"Yes, you retain full control over your billing from your settings dashboard. You can upgrade, switch billing cycles, or cancel your Pro membership instantly without hassle.",
		category: "Pricing",
	},
];

let faqCategory = $state("All");
const faqCategories = ["All", "General", "Features", "Pricing", "Security"];
const filteredFaqs = $derived(
	faqCategory === "All"
		? faqItems
		: faqItems.filter((item) => item.category === faqCategory),
);

let copied = $state(false);
function copyBrewCommand() {
	navigator.clipboard.writeText("brew install --cask Tsuzat/tap/nota");
	copied = true;
	setTimeout(() => {
		copied = false;
	}, 2000);
}

let showFirstSection = $state(false);
let activeSection = $state("hero");
onMount(() => {
	setTimeout(() => {
		showFirstSection = true;
	}, 500);

	// Intersection observer for section visibility (animations)
	const sections = document.querySelectorAll("section:not(#landing)");
	const animationObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("show");
			}
		});
	});
	sections.forEach((section) => {
		section.classList.add("hide");
		animationObserver.observe(section);
	});

	// Intersection observer for active nav item
	const navObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					activeSection = entry.target.id;
				}
			});
		},
		{ rootMargin: "-20% 0px -60% 0px" },
	);
	const allSections = document.querySelectorAll("section");
	allSections.forEach((section) => {
		navObserver.observe(section);
	});

	// Radiant card mouse effect
	const radiantCards = document.querySelectorAll(".radiant-card");
	radiantCards.forEach((card) => {
		card.addEventListener("mousemove", (ev) => {
			const e = ev as MouseEvent;
			const rect = (card as HTMLElement).getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			(card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
			(card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
		});
	});
});
</script>

<svelte:window bind:scrollY={y} />
<svelte:head>
  <title>Nota</title>
  <meta
    name="description"
    content="Nota is a fast, lightweight, and feature-rich note-taking app. Experience a rich text editor with markdown shortcuts, AI powers (BYOK), and cross-platform desktop & web support."
  />
  <link rel="canonical" href="https://nota.ink" />

  <!-- Open Graph overrides -->
  <meta property="og:title" content="Nota" />
  <meta
    property="og:description"
    content="A nimble, high-performance note-taking app with rich text editing, AI powers, and cross-platform support without the Electron bloat."
  />
  <meta property="og:url" content="https://nota.ink" />

  <!-- X/Twitter overrides -->
  <meta name="twitter:title" content="Nota" />
  <meta
    name="twitter:description"
    content="A nimble, high-performance note-taking app with rich text editing, AI powers, and cross-platform support without the Electron bloat."
  />

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Nota",
      "operatingSystem": "All",
      "applicationCategory": "ProductivityApplication",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      },
      "description": "Nota is a fast, lightweight, and feature-rich note-taking app built with Svelte 5 and Rust. Featuring a powerful rich text editor, AI integration (BYOK), and cross-platform desktop & web support."
    }
  </script>
  <!-- Schema.org FAQPage JSON-LD -->
  <script type="application/ld+json">
    {@html faqJsonLdSafe}
  </script>
</svelte:head>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />
<Spotlight />

<header
  class={cn(
    "sticky z-50 mx-auto flex items-center justify-between gap-8 rounded-xl px-2 backdrop-blur-sm transition-all duration-500",
    isScrolled
      ? "max-w-4xl border bg-background/60 p-4 shadow-lg sm:top-2"
      : "top-0 max-w-full bg-background/20 p-4 sm:px-12",
  )}
>
  <AppLogo showLogo={!isScrolled} />
  <!-- Desktop Navigation -->
  <div class="hidden items-center gap-8 md:flex">
    {#each tabItems as item, idx (idx)}
      <a
        href={item.url}
        title="Open Nav"
        class="nodefault relative py-1 text-muted-foreground capitalize transition-all duration-500 hover:text-primary {activeSection ===
        item.url.substring(1)
          ? 'font-medium text-primary'
          : ''}"
      >
        {item.title}
        {#if activeSection === item.url.substring(1)}
          <div
            transition:fade={{ duration: 300 }}
            class="absolute -bottom-1 left-0 h-0.5 w-full bg-primary"
          ></div>
        {/if}
      </a>
    {/each}
  </div>

  <div class="flex items-center gap-2">
    <!-- Mobile Navigation -->
    <div class="md:hidden">
      <Dropdown.Root>
        <Dropdown.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Menu />
          <span class="sr-only">Links</span>
        </Dropdown.Trigger>
        <Dropdown.Content class="w-fit md:hidden">
          {#each tabItems as item, idx (idx)}
            <Dropdown.Item>
              <a
                href={item.url}
                title="Open Nav"
                class="nodefault block w-full capitalize"
              >
                {item.title}
              </a>
            </Dropdown.Item>
          {/each}
        </Dropdown.Content>
      </Dropdown.Root>
    </div>
    <ToggleMode />
    {#if $sessionQuery.data?.user}
      {@const user = $sessionQuery.data.user}
      <Dropdown.Root>
        <Dropdown.Trigger>
          <UserAvatar image={user.image ?? ""} name={user.name ?? "Unknown"}
          />
        </Dropdown.Trigger>
        <Dropdown.Content class="w-fit">
          <Dropdown.Group>
            <Dropdown.Label>{user.name}</Dropdown.Label>
              <Dropdown.Item>
                Go to App
              </Dropdown.Item>
              <Dropdown.Item>
                Home
              </Dropdown.Item>
            <Dropdown.Item
              variant="destructive"
              onclick={handleSignout}
            >
              Sign Out
            </Dropdown.Item>
          </Dropdown.Group>
        </Dropdown.Content>
      </Dropdown.Root>
    {:else if $sessionQuery.isPending}
      <BarSpinner />
    {:else}
      <Button href={resolve("/signin")}>Sign In</Button>
    {/if}
  </div>
</header>

<main class="mx-auto max-w-4xl px-2 text-center sm:px-0">
  <section
    id="landing"
    class="transition-all duration-1000 *:my-8 {showFirstSection
      ? 'translate-y-0 opacity-100'
      : 'translate-y-10 opacity-0'}"
  >
    <a
      class="group nodefault relative z-10 mx-auto flex w-fit items-center gap-4 rounded-2xl border bg-primary/30 p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 hover:bg-background dark:border-t-white/5 dark:shadow-zinc-950 dark:hover:border-t-border"
      href="#pricing"
      title="Open Pricing"
    >
      <span class="text-sm text-foreground"
        >✨ Completely <span class="font-bold">Free</span> For Local Usages ✨</span
      >
      <span
        class="block h-4 w-0.5 border-l bg-muted-foreground dark:border-background"
      ></span>
      <div
        class="size-6 overflow-hidden rounded-full bg-background duration-500 group-hover:bg-primary"
      >
        <div
          class="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0"
        >
          <span class="flex size-6">
            <ArrowRight class="m-auto size-4 text-background!" />
          </span>
          <span class="flex size-6">
            <ArrowRight class="m-auto size-4 text-foreground!" />
          </span>
        </div>
      </div>
    </a>
    <h1 class="text-balance">Fast, Lightweight & Feature-Rich Note-Taking</h1>
    <p class="text-balance text-muted-foreground">
      Nota is a powerful, local-first note-taking application. Its core purpose
      is to provide users with a fast and efficient platform to organize
      personal and professional notes, featuring rich text editing, AI
      integration, and secure, cross-platform synchronization without the bloat.
    </p>
    <div class="flex flex-wrap items-center justify-center gap-2 my-4">
      <!-- 1. GitHub Repo -->
      <Button
        variant="default"
        href="https://github.com/Tsuzat/Nota"
        target="_blank"
        rel="noopener noreferrer"
        class="z-100"
      >
         <img
            class="hidden dark:block size-4"
            src="https://svgl.app/library/github_light.svg"
            alt="Github"
          />
          <img
            class="block dark:hidden size-4"
            src="https://svgl.app/library/github_dark.svg"
            alt="Github"
          />
        <span>GitHub Repo</span>
      </Button>

      <!-- 2. Playground -->
      <Button
        variant="outline"
        href="https://edra.tsuzat.com/templates/notion"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Sparkles />
        <span>Playground</span>
      </Button>

      {#await getArtefacts()}
        <Button>
          <BarSpinner />
          Loading
        </Button>
      {:then artefacts}
        {#if artefacts}
          <ArtifactDownloader platforms={artefacts.platforms} />
        {/if}
      {:catch}
        <span></span>
      {/await}
    </div>

    <div class="relative my-4 flex items-center justify-center">
      <button
        onclick={copyBrewCommand}
        class="group relative flex items-center gap-3 rounded-lg border bg-muted/40 px-3.5 py-1.5 font-mono text-xs transition-colors hover:border-primary/50 hover:bg-muted/80 cursor-pointer"
        title="Copy Homebrew install command"
      >
        <span class="font-semibold text-primary">$</span>
        <pre class="font-mono text-sm bg-transparent whitespace-pre-wrap"><code
            ><span class="text-purple-700 dark:text-[#d2a8ff]">brew</span> <span
              class="text-[#24292f] dark:text-[#c9d1d9]">install</span
            > <span class="text-[#0550ae] dark:text-[#79c0ff]">--cask</span
            > <span class="text-[#0a3069] dark:text-[#a5d6ff]"
              >Tsuzat/tap/nota</span
            ></code
          ></pre>
        {#if copied}
          <Check class="size-3.5 text-emerald-500" />
        {:else}
          <Copy
            class="size-3.5 opacity-60 transition-opacity group-hover:opacity-100"
          />
        {/if}
      </button>
    </div>

    <Tiltcard
      tiltLimit={10}
      scale={1.025}
      spotlight={false}
      perspective={1200}
      class="relative overflow-hidden! h-full w-full rounded-xl shadow-lg inset-shadow-2xs shadow-zinc-950/15 dark:inset-shadow-white/20"
    >
      <BorderBeam
        duration={6}
        size={400}
        class="from-transparent via-orange-500 to-transparent"
      />
      <BorderBeam
        duration={6}
        delay={3}
        size={400}
        borderWidth={2}
        class="from-transparent via-purple-500 to-transparent"
      />
      <img
        src="/preview/light.png"
        alt="Nota Light Preview"
        class="block h-full w-full rounded-xl border object-cover dark:hidden"
      />
      <img
        src="/preview/dark.png"
        alt="Nota Dark Preview"
        class="hidden h-full w-full rounded-xl border object-cover dark:block"
      />
    </Tiltcard>
  </section>

  <section id="performance" class="my-20">
    <div class="flex flex-col items-center gap-4 text-center">
      <h1 class="text-4xl font-bold">Instantly Ready When You Are</h1>
      <p class="text-lg text-balance text-muted-foreground">
        Powered by Rust (Tauri) on desktop and Svelte on the web, Nota delivers
        the same blazingly fast experience on every platform. No loading
        screens, no Electron overhead—just instant access to your thoughts
        everywhere. See it launch via Raycast below.
      </p>
    </div>
    <Tiltcard
      tiltLimit={5}
      scale={1.01}
      spotlight={false}
      perspective={1200}
      class="relative mx-auto mt-8 overflow-hidden! h-full w-full rounded-xl shadow-lg inset-shadow-2xs shadow-zinc-950/15 dark:inset-shadow-white/20"
    >
      <BorderBeam
        duration={4}
        size={300}
        class="from-transparent via-cyan-500 to-transparent"
      />
      <video
        src="https://storage.nota.ink/internal/demo-launch.mov"
        autoplay
        loop
        muted
        playsinline
        class="block h-full w-full rounded-xl border object-cover"
      ></video>
    </Tiltcard>
  </section>

  <section id="demos" class="my-20">
    <div class="flex flex-col items-center gap-4 text-center">
      <h1 class="text-4xl font-bold">Built for Speed & Flow</h1>
      <p class="text-lg text-balance text-muted-foreground">
        Explore how Nota streamlines workspace management, note organization,
        and icon customization.
      </p>
    </div>

    <div class="mt-12 grid grid-cols-1 items-start gap-8 md:grid-cols-3">
      <!-- Card 1: Custom Icons -->
      <div class="flex flex-col items-center text-center">
        <Tiltcard
          tiltLimit={5}
          scale={1.01}
          spotlight={false}
          perspective={1200}
          class="relative w-full overflow-hidden! rounded-xl shadow-lg inset-shadow-2xs shadow-zinc-950/15 dark:inset-shadow-white/20"
        >
          <BorderBeam
            duration={6}
            size={300}
            class="from-transparent via-amber-500 to-transparent"
          />
          <video
            src="https://storage.nota.ink/internal/icons.mov"
            autoplay
            loop
            muted
            playsinline
            class="block h-auto w-full rounded-xl border object-cover"
          ></video>
        </Tiltcard>
        <h3 class="mt-4 text-xl font-semibold">Custom Icons & Emojis</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Personalize workspaces and notes with custom emojis, icons, or custom
          image URLs.
        </p>
      </div>

      <!-- Card 2: Nested Note Hierarchy -->
      <div class="flex flex-col items-center text-center">
        <Tiltcard
          tiltLimit={5}
          scale={1.01}
          spotlight={false}
          perspective={1200}
          class="relative w-full overflow-hidden! rounded-xl shadow-lg inset-shadow-2xs shadow-zinc-950/15 dark:inset-shadow-white/20"
        >
          <BorderBeam
            duration={6}
            delay={2}
            size={300}
            class="from-transparent via-indigo-500 to-transparent"
          />
          <video
            src="https://storage.nota.ink/internal/note-tile.mov"
            autoplay
            loop
            muted
            playsinline
            class="block h-auto w-full rounded-xl border object-cover"
          ></video>
        </Tiltcard>
        <h3 class="mt-4 text-xl font-semibold">Nested Note Tree</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Organize your notes with an intuitive tree structure and expandable
          child notes.
        </p>
      </div>

      <!-- Card 3: Workspace Switcher -->
      <div class="flex flex-col items-center text-center">
        <Tiltcard
          tiltLimit={5}
          scale={1.01}
          spotlight={false}
          perspective={1200}
          class="relative w-full overflow-hidden! rounded-xl shadow-lg inset-shadow-2xs shadow-zinc-950/15 dark:inset-shadow-white/20"
        >
          <BorderBeam
            duration={6}
            delay={4}
            size={300}
            class="from-transparent via-emerald-500 to-transparent"
          />
          <video
            src="https://storage.nota.ink/internal/workspaces.mov"
            autoplay
            loop
            muted
            playsinline
            class="block h-auto w-full rounded-xl border object-cover"
          ></video>
        </Tiltcard>
        <h3 class="mt-4 text-xl font-semibold">Workspace Switching</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Seamlessly toggle between local and cloud workspaces to organize
          different projects.
        </p>
      </div>
    </div>
  </section>

  <section id="features">
    <div class="flex flex-col items-center gap-4">
      <h1 class="text-4xl font-bold">Everything you need to write</h1>
      <p class="text-lg text-balance text-muted-foreground">
        Fast, precise, and enjoyable to drive—stripping away the bloat while
        keeping the power.
      </p>
    </div>
    <dl class="my-20 grid grid-cols-2 gap-10">
      {#each features as item, idx (idx)}
        {@const Icon = item.icon}
        <div class="col-span-full sm:col-span-2 lg:col-span-1">
          <div
            class="mx-auto flex w-fit rounded-lg p-2 shadow-md ring-1 shadow-primary/50 ring-black/5 dark:ring-white/5"
          >
            <Icon aria-hidden="true" class="size-6 text-muted-foreground" />
          </div>
          <dt
            class="mt-6 text-center font-semibold text-gray-900 dark:text-gray-50"
          >
            {item.name}
          </dt>
          <dd
            class="mt-2 text-center leading-7 text-gray-600 dark:text-gray-400"
          >
            {item.description}
          </dd>
        </div>
      {/each}
    </dl>
    <div class="flex flex-col items-center gap-4 text-center">
      <h1 class="text-4xl font-bold">Powerfully Versatile</h1>
      <span class="text-lg text-balance text-muted-foreground"
        >Create rich and beautiful notes for anything, we support it all.
      </span>
    </div>
    <div class="relative mx-auto mt-4 w-full overflow-hidden! rounded-2xl">
      <BorderBeam
        duration={6}
        size={400}
        class="from-transparent via-pink-500 to-transparent"
      />
      <BorderBeam
        duration={6}
        delay={3}
        size={400}
        borderWidth={2}
        class="from-transparent via-emerald-500 to-transparent"
      />
      <Multistream class="mx-auto rounded-2xl" />
    </div>
  </section>

  <section id="pricing" class="text-start!">
    <Pricing />
    <div class="mt-8 flex justify-center">
      <Button
        variant="link"
        href="/pricing"
        class="text-primary hover:text-primary/80"
      >
        View full feature comparison &xrarr;
      </Button>
    </div>
  </section>

  <section id="faqs" class="my-4">
    <div class="mx-auto px-4 md:px-6">
      <div class="mx-auto max-w-2xl text-center text-balance">
        <h2 class="text-3xl font-bold tracking-tight md:text-4xl">
          Frequently Asked Questions
        </h2>
        <p class="mt-4 text-balance text-muted-foreground">
          Discover comprehensive answers about our architecture, pricing models,
          editor capabilities, and data privacy.
        </p>
      </div>

      <div class="mx-auto mt-8 max-w-3xl">
        <!-- Category Filters -->
        <div class="mb-6 flex flex-wrap items-center justify-center gap-2">
          {#each faqCategories as cat (cat)}
            <Button
              variant={faqCategory === cat ? "default" : "outline"}
              size="sm"
              class="rounded-full px-4 text-xs font-semibold"
              onclick={() => {
                faqCategory = cat;
              }}
            >
              {cat}
            </Button>
          {/each}
        </div>

        <Accordion
          type="single"
          class="w-full rounded-xl border bg-background px-6 py-2 shadow-sm ring-4 ring-muted md:px-8 dark:ring-0"
        >
          {#each filteredFaqs as item, index (item.id)}
            <AccordionItem
              value={item.id}
              class={[
                filteredFaqs.length - 1 !== index
                  ? "border-dashed"
                  : "border-none",
              ]}
            >
              <AccordionTrigger
                class="cursor-pointer text-left text-base font-semibold hover:no-underline"
              >
                <div
                  class="flex flex-col gap-1 pr-2 text-left md:flex-row md:items-center md:gap-3"
                >
                  <span>{item.question}</span>
                  <span
                    class="w-fit rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium tracking-normal text-muted-foreground"
                  >
                    {item.category}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p class="text-base text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          {/each}
        </Accordion>

        <p class="mt-6 px-4 text-muted-foreground">
          Can't find what you're looking for?
          <a
            href="mailto:contact@nota.ink"
            title="Contact Us"
            class="font-medium text-primary hover:underline"
          >
            Contact Us
          </a>
        </p>
      </div>
    </div>
  </section>
  <footer class="flex items-center justify-center gap-2 border-t py-4 text-sm">
    © 2026 Nota. All rights reserved •
    <a href="/terms" title="Open Terms of Use" class="text-primary"
      >Terms of Use</a
    >
    •
    <a href="/privacy" title="Open Privacy Policy" class="text-primary"
      >Privacy Policy</a
    >
    •
    <a href="/blog" title="Open Blog & Insights" class="text-primary">Blog</a>
    •
    <a href="mailto:contact@nota.ink" title="Contact Us" class="text-primary"
      >Contact Us</a
    >
  </footer>
</main>

<style>
  section {
    padding-top: 5rem;
  }

  .highlight {
    background-color: var(--color-primary);
    padding: 0 4px;
    border-radius: 4px;
    color: var(--color-foreground);
  }

  :global(section.hide) {
    opacity: 0;
    filter: blur(4px);
    transform: translateY(4rem);
    transition: all 500ms ease-in-out;
    transition-delay: 300ms;
  }

  :global(section.show) {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(section.hide) {
      transition: none;
    }
  }
</style>