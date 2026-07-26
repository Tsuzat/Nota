<script lang="ts">
  import Spotlight from "$lib/components/custom/landing/spotlight.svelte";
  import ToggleMode from "@nota/ui/custom/ToggleMode.svelte";
  import { onMount } from "svelte";
  import AppLogo from "$lib/components/custom/applogo.svelte";
  import { cn } from "@nota/ui/utils";
  import { fade } from "svelte/transition";
  import { icons } from "@nota/ui/icons/index.ts";
  import { buttonVariants, Button } from "@nota/ui/shadcn/button";
  import * as Dropdown from "@nota/ui/shadcn/dropdown-menu";
  import type { User } from "@nota/client";
  import UserAvatar from "$lib/components/custom/user-avatar.svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import BorderBeam from "$lib/components/custom/landing/border-beam.svelte";

  let user = $state<User | null>(null);
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
  ];
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
    allSections.forEach((section) => navObserver.observe(section));

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

<Spotlight />

<header
  class={cn(
    "sticky z-50 mx-auto flex items-center justify-between gap-8 rounded-xl px-2 backdrop-blur-sm transition-all duration-500",
    isScrolled
      ? "max-w-4xl border bg-background/60 p-2 shadow-lg sm:top-2"
      : "top-0 max-w-full bg-background/20 px-2 py-2 sm:px-12",
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
            // layoutId="nav-underline"
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
            <Dropdown.Label class="text-xs text-muted-foreground">
              {user.email}
            </Dropdown.Label>
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
      <Button class="nodefault" href={resolve("/signin")}>Sign In</Button>
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
        >✨ Use code <span class="font-bold">EARLY10</span> for 10% off ✨</span
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
            <icons.ArrowRight class="m-auto size-4 text-foreground!" />
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
    <div class="flex items-center justify-center gap-4">
      <Button>Get Started</Button>
      <Button variant="outline" href="#pricing">See Pricing</Button>
    </div>

    <div
      class="relative h-full w-full rounded-xl shadow-lg inset-shadow-2xs shadow-zinc-950/15 dark:inset-shadow-white/20"
    >
      <BorderBeam
        duration={6}
        size={150}
        class="from-transparent via-primary to-transparent"
      />
      <BorderBeam
        duration={6}
        delay={3}
        size={150}
        borderWidth={2}
        class="from-transparent via-muted to-transparent"
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
    </div>
  </section>
</main>
