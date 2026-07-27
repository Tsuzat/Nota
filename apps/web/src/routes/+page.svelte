<script lang="ts">
import ToggleMode from '@nota/ui/custom/ToggleMode.svelte';
import { BarSpinner, Github, icons } from '@nota/ui/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@nota/ui/shadcn/accordion';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Dropdown from '@nota/ui/shadcn/dropdown-menu';
import { cn } from '@nota/ui/utils';
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import ArtifactDownloader from '$lib/artefact/artifact-downloader.svelte';
import AppLogo from '$lib/components/custom/applogo.svelte';
import BorderBeam from '$lib/components/custom/landing/border-beam.svelte';
import Multistream from '$lib/components/custom/landing/multistream.svelte';
import Particles from '$lib/components/custom/landing/particles.svelte';
import { Pricing } from '$lib/components/custom/landing/pricing';
import Spotlight from '$lib/components/custom/landing/spotlight.svelte';
import Tiltcard from '$lib/components/custom/landing/utils/tiltcard.svelte';
import UserAvatar from '$lib/components/custom/user-avatar.svelte';
import { getArtefacts } from './data.remote';

const { data } = $props();
const user = $derived(data.user);

let y = $state(0);
let isScrolled = $derived(y > 20);
const tabItems = [
  {
    url: '#features',
    title: 'Features',
  },
  {
    url: '#solutions',
    title: 'Solution',
  },
  {
    url: '#pricing',
    title: 'Pricing',
  },
  {
    url: '#faqs',
    title: 'FAQs',
  },
];

const features = [
  {
    name: 'Rich Text Editor',
    description:
      'Powered by a custom editor with support for slash commands, markdown shortcuts, media embeds, and mathematical equations.',
    icon: icons.Pencil,
  },
  {
    name: 'AI Integration',
    description:
      'Built-in AI assistant for text generation and summarization with a Bring Your Own Key (BYOK) model to keep costs down.',
    icon: icons.Bot,
  },
  {
    name: 'Cross-Platform & Fast',
    description:
      'Available as a lightweight Desktop app built with Rust (Tauri) and on the Web for blazing fast performance.',
    icon: icons.Zap,
  },
  {
    name: 'Secure & Organized',
    description:
      'Manage your notes with hierarchical workspaces. Protected by custom authentication flow and session management.',
    icon: icons.FolderLock,
  },
];

const faqItems = [
  {
    id: 'item-1',
    question: 'What is Nota?',
    answer:
      'Nota is a fast, lightweight, and feature-rich note-taking app designed to give you a powerful rich text editing experience without the bloat of typical Electron applications. It is available on Desktop (macOS, Windows, Linux) and the Web.',
  },
  {
    id: 'item-2',
    question: 'Is Nota free to use?',
    answer:
      'Yes! Our Free tier is perfect for local-first users, offering unlimited local notes and workspaces. You also get 1 cloud workspace and up to 5 cloud notes for free.',
  },
  {
    id: 'item-3',
    question: 'How does the AI integration work?',
    answer:
      'Nota uses a Bring Your Own Key (BYOK) model. You can plug in your own API keys to generate text and summarize notes without paying a high recurring subscription fee. Pro users can also use our bundled AI credits.',
  },
  {
    id: 'item-4',
    question: 'What is the difference between the Free and Pro plans?',
    answer:
      'The Free plan offers unlimited local notes, local media storage, and limited cloud syncing (1 workspace, 5 notes). The Pro plan unlocks unlimited cloud notes and workspaces, 5 GB of cloud storage, collaborative notes, web access, and bundled AI credits.',
  },
  {
    id: 'item-5',
    question: 'Can I use Nota offline?',
    answer:
      "Absolutely! Nota's Desktop app is built with Tauri and supports a local-first approach. Your notes are saved locally and are fully accessible even when you are not connected to the internet.",
  },
  {
    id: 'item-6',
    question: 'What features does the editor support?',
    answer:
      'Our custom rich text editor supports slash commands, markdown shortcuts, media embeds (images, video, audio), mathematical equations (KaTeX), tables, and task lists.',
  },
  {
    id: 'item-7',
    question: 'Can I collaborate on notes with others?',
    answer:
      'Yes, realtime collaboration is available on our Pro plan. You can invite others to collaborate on your cloud notes and work together seamlessly.',
  },
  {
    id: 'item-8',
    question: 'How do you handle my data and security?',
    answer:
      'We prioritize your privacy. Your cloud data is encrypted, and your local notes stay strictly on your device. We use a secure authentication flow and reliable session management to keep your information safe.',
  },
  {
    id: 'item-9',
    question: 'Can I upgrade, downgrade, or cancel anytime?',
    answer:
      'Yes, you have full control over your subscription. You can upgrade, downgrade, or cancel your Pro plan at any time from your settings.',
  },
];
let copied = $state(false);
function copyBrewCommand() {
  navigator.clipboard.writeText('brew install --cask Tsuzat/tap/nota');
  copied = true;
  setTimeout(() => {
    copied = false;
  }, 2000);
}

let showFirstSection = $state(false);
let activeSection = $state('hero');
onMount(() => {
  setTimeout(() => {
    showFirstSection = true;
  }, 500);

  // Intersection observer for section visibility (animations)
  const sections = document.querySelectorAll('section:not(#landing)');
  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  });
  sections.forEach((section) => {
    section.classList.add('hide');
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
    { rootMargin: '-20% 0px -60% 0px' }
  );
  const allSections = document.querySelectorAll('section');
  allSections.forEach((section) => navObserver.observe(section));

  // Radiant card mouse effect
  const radiantCards = document.querySelectorAll('.radiant-card');
  radiantCards.forEach((card) => {
    card.addEventListener('mousemove', (ev) => {
      const e = ev as MouseEvent;
      const rect = (card as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
      (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
    });
  });
});
</script>

<svelte:window bind:scrollY={y} />
<svelte:head>
  <title>Nota | Fast, Lightweight, Feature-Rich Note-Taking App</title>
  <meta
    name="description"
    content="Nota is a fast, lightweight, and feature-rich note-taking app. Experience a rich text editor with markdown shortcuts, AI powers (BYOK), and cross-platform desktop & web support."
  />
  <link rel="canonical" href="https://nota.ink" />

  <!-- Open Graph overrides -->
  <meta
    property="og:title"
    content="Nota — Fast, Lightweight, Feature-Rich Note-Taking App"
  />
  <meta
    property="og:description"
    content="A nimble, high-performance note-taking app with rich text editing, AI powers, and cross-platform support without the Electron bloat."
  />
  <meta property="og:url" content="https://nota.ink" />

  <!-- X/Twitter overrides -->
  <meta
    name="twitter:title"
    content="Nota — Fast, Lightweight, Feature-Rich Note-Taking App"
  />
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
</svelte:head>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />
<Spotlight />

<header
  class={cn(
    "sticky z-50 mx-auto flex items-center justify-between gap-8 rounded-xl px-2 backdrop-blur-sm transition-all duration-500",
    isScrolled
      ? "max-w-4xl border bg-background/60 p-4 shadow-lg sm:top-2"
      : "top-0 max-w-full bg-background/20 px-4 py-2 sm:px-12",
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
          <icons.Menu />
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
    {#if user}
      <Dropdown.Root>
        <Dropdown.Trigger>
          <UserAvatar
            image={user.avatar_url ?? ""}
            name={user.name ?? "Unknown"}
          />
        </Dropdown.Trigger>
        <Dropdown.Content class="w-fit">
          <Dropdown.Group>
            <Dropdown.Label>{user.name}</Dropdown.Label>
            <a href={resolve("/profile")}>
              <Dropdown.Item>
                <icons.User />
                Profile
              </Dropdown.Item>
            </a>
            <a href={resolve("/(app)/home")}>
              <Dropdown.Item>
                <icons.House />
                Home
              </Dropdown.Item>
            </a>
            <Dropdown.Item
              variant="destructive"
              onclick={() => goto(resolve("/signout"))}
            >
              <icons.LogOut />
              Sign Out
            </Dropdown.Item>
          </Dropdown.Group>
        </Dropdown.Content>
      </Dropdown.Root>
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
            <icons.ArrowRight class="m-auto size-4 text-background!" />
          </span>
          <span class="flex size-6">
            <icons.ArrowRight class="m-auto size-4 text-foreground!" />
          </span>
        </div>
      </div>
    </a>
    <h1 class="text-balance">Fast, Lightweight & Feature-Rich Note-Taking</h1>
    <p class="text-balance text-muted-foreground">
      Nota is designed to be the nimble sports car of note-taking—stripping away
      the bloat while keeping the power where it matters. Enjoy a rich text
      editor with markdown shortcuts, AI powers, and cross-platform speed.
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
        <Github />
        <span>GitHub Repo</span>
      </Button>

      <!-- 2. Playground -->
      <Button
        variant="secondary"
        href="https://edra.tsuzat.com/templates/notion"
        target="_blank"
        rel="noopener noreferrer"
      >
        <icons.Sparkles />
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
      {:catch error}
        {console.error(error)}
      {/await}
    </div>

    <div class="relative my-4 flex items-center justify-center">
      <button
        onclick={copyBrewCommand}
        class="group relative flex items-center gap-3 rounded-lg border bg-muted/40 px-3.5 py-1.5 font-mono text-xs transition-colors hover:border-primary/50 hover:bg-muted/80 cursor-pointer"
        title="Copy Homebrew install command"
      >
        <span class="font-semibold text-primary">$</span>
        <span>brew install --cask Tsuzat/tap/nota</span>
        {#if copied}
          <icons.Check class="size-3.5 text-emerald-500" />
        {:else}
          <icons.Copy
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
  </section>

  <section id="faqs" class="my-4">
    <div class="mx-auto px-4 md:px-6">
      <div class="mx-auto max-w-2xl text-center text-balance">
        <h1>Frequently Asked Questions</h1>
        <p class="mt-4 text-balance text-muted-foreground">
          Discover quick and comprehensive answers to common questions about our
          platform, services, and features.
        </p>
      </div>

      <div class="mx-auto mt-12 max-w-2xl">
        <Accordion
          type="single"
          class="w-full rounded-xl border bg-background px-8 py-3 shadow-sm ring-4 ring-muted dark:ring-0"
        >
          {#each faqItems as item, index (index)}
            <AccordionItem
              value={item.id}
              class={[
                faqItems.length - 1 !== index ? "border-dashed" : "border-none",
              ]}
            >
              <AccordionTrigger
                class="cursor-pointer text-base font-semibold hover:no-underline"
                >{item.question}</AccordionTrigger
              >
              <AccordionContent>
                <p class="text-base">{item.answer}</p>
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
    <a href={resolve("/terms")} title="Open Terms of Use" class="text-primary"
      >Terms of Use</a
    >
    •
    <a
      href={resolve("/privacy")}
      title="Open Privacy Policy"
      class="text-primary">Privacy Policy</a
    >
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
