<script lang="ts">
  import AppLogo from "$lib/components/custom/applogo.svelte";
  import ToggleMode from "@nota/ui/custom/ToggleMode.svelte";
  import Particles from "$lib/components/custom/landing/particles.svelte";
  import Spotlight from "$lib/components/custom/landing/spotlight.svelte";
  import { Button } from "@nota/ui/shadcn/button";
  import { icons } from "@nota/ui/icons/index.ts";
  import { resolve } from "$app/paths";

  const lastUpdated = "July 26, 2026";

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "description", title: "2. Description of Service & Pricing Plans" },
    { id: "account", title: "3. Account Registration & Security" },
    { id: "user-content", title: "4. User Content & Ownership" },
    { id: "ai-byok", title: "5. AI Integration & BYOK (Bring Your Own Key)" },
    { id: "local-first", title: "6. Local-First Storage & Offline Use" },
    { id: "billing", title: "7. Subscriptions, Payments & Cancellations" },
    { id: "prohibited", title: "8. Acceptable Use & Prohibited Conduct" },
    { id: "disclaimers", title: "9. Disclaimers & Limitation of Liability" },
    { id: "termination", title: "10. Termination & Changes to Terms" },
    { id: "contact", title: "11. Contact Information" },
  ];
</script>

<svelte:head>
  <title>Terms of Service | Nota — Fast, Lightweight Note-Taking App</title>
  <meta
    name="description"
    content="Read the Terms of Service for Nota note-taking application. Information on account usage, local-first storage, AI BYOK integrations, and subscription billing."
  />
  <link rel="canonical" href="https://nota.ink/terms" />
  <meta
    name="robots"
    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://nota.ink/terms" />
  <meta
    property="og:title"
    content="Terms of Service | Nota — Fast, Lightweight Note-Taking App"
  />
  <meta
    property="og:description"
    content="Read the Terms of Service for Nota note-taking application. Information on account usage, local-first storage, AI BYOK integrations, and subscription billing."
  />
  <meta property="og:site_name" content="Nota" />
  <meta property="og:image" content="https://nota.ink/previews/dark.webp" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://nota.ink/terms" />
  <meta name="twitter:title" content="Terms of Service | Nota" />
  <meta
    name="twitter:description"
    content="Read the Terms of Service for Nota note-taking application."
  />
  <meta name="twitter:image" content="https://nota.ink/previews/dark.webp" />

  <!-- Google Search Console Verification Meta Placeholder -->
  <!-- Replace content value with your actual Google Search Console verification code -->
  <!-- <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_TOKEN" /> -->

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://nota.ink/terms",
          "url": "https://nota.ink/terms",
          "name": "Terms of Service | Nota",
          "description": "Terms of Service for Nota note-taking application.",
          "isPartOf": {
            "@type": "WebSite",
            "@id": "https://nota.ink/#website",
            "url": "https://nota.ink/",
            "name": "Nota"
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://nota.ink/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Terms of Service",
              "item": "https://nota.ink/terms"
            }
          ]
        }
      ]
    }
  </script>
</svelte:head>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />

<header
  class="sticky top-0 z-50 mx-auto flex max-w-5xl items-center justify-between px-4 py-3 backdrop-blur-md sm:px-8"
>
  <div class="flex items-center gap-4">
    <AppLogo />
    <span
      class="text-xs font-semibold text-muted-foreground uppercase tracking-widest hidden sm:inline-block border-l pl-3"
      >Legal</span
    >
  </div>
  <div class="flex items-center gap-3">
    <Button variant="ghost" size="sm" href={resolve("/")} class="gap-2">
      <icons.ArrowLeft class="size-4" />
      <span>Back to Home</span>
    </Button>
    <ToggleMode />
  </div>
</header>

<main class="mx-auto max-w-5xl px-4 py-10 sm:px-8">
  <!-- Hero / Header -->
  <div class="mb-12 pb-4 text-start">
    <div
      class="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4"
    >
      <icons.FileText class="size-3.5 text-primary" />
      <span>Legal Document</span>
    </div>
    <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
      Terms of Service
    </h1>
    <p class="mt-3 text-base text-muted-foreground sm:text-lg">
      Please read these terms carefully before using Nota. Last updated: <span
        class="font-semibold text-foreground">{lastUpdated}</span
      >.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-10 lg:grid-cols-4">
    <!-- Main Terms Content -->
    <article class="lg:col-span-3 space-y-10 text-foreground leading-relaxed">
      <!-- Section 1 -->
      <section
        id="acceptance"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >1</span
          >
          Acceptance of Terms
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            By accessing or using the Nota web application, desktop client
            (macOS, Windows, Linux), or any associated services (collectively,
            the "Service"), you agree to be bound by these Terms of Service
            ("Terms"). If you do not agree to these Terms, you must immediately
            cease using the Service.
          </p>
          <p>
            These Terms apply to all users, including visitors, free plan users,
            and paying subscribers.
          </p>
        </div>
      </section>

      <!-- Section 2 -->
      <section
        id="description"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >2</span
          >
          Description of Service & Pricing Plans
        </h2>
        <div class="space-y-4 text-sm sm:text-base text-muted-foreground">
          <p>
            Nota is a lightweight, high-performance note-taking application
            featuring rich text editing, AI capabilities, local storage, and
            cloud synchronization.
          </p>
          <div class="rounded-xl border bg-muted/40 p-4 space-y-2">
            <h4 class="font-semibold text-foreground text-sm">
              Plan Structure Overview:
            </h4>
            <ul class="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong class="text-foreground">Free Tier:</strong> Includes unlimited
                local notes and local workspaces, 1 cloud workspace, 5 cloud notes,
                local media storage, and access to Bring Your Own Key (BYOK) AI features
                or purchaseable AI credits.
              </li>
              <li>
                <strong class="text-foreground"
                  >Pro Tier ($5/mo or $50/yr):</strong
                > Unlocks unlimited cloud notes and workspaces, 5 GB of cloud media
                storage, collaborative editing, web access, encrypted data sync,
                and monthly AI credits.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Section 3 -->
      <section
        id="account"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >3</span
          >
          Account Registration & Security
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            To utilize cloud synchronization and collaborative features, you
            must create an account. You agree to provide accurate and complete
            account details and to keep your credentials confidential.
          </p>
          <p>
            You are solely responsible for all activities occurring under your
            account. Notify us immediately at <a
              href="mailto:contact@nota.ink"
              class="text-primary font-medium hover:underline"
              >contact@nota.ink</a
            > if you suspect unauthorized access.
          </p>
        </div>
      </section>

      <!-- Section 4 -->
      <section
        id="user-content"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >4</span
          >
          User Content & Ownership
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            <strong class="text-foreground"
              >You retain 100% ownership of your content.</strong
            > Nota does not claim any intellectual property rights over the text,
            media, documents, or files you create or upload in the app.
          </p>
          <p>
            By uploading cloud notes or sharing workspaces, you grant Nota a
            limited, worldwide, non-exclusive license strictly necessary to
            store, transmit, format, and display your content to you and your
            authorized collaborators.
          </p>
        </div>
      </section>

      <!-- Section 5 -->
      <section
        id="ai-byok"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >5</span
          >
          AI Integration & Bring Your Own Key (BYOK)
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            Nota features an AI assistant powered by third-party model providers
            (such as OpenAI, Anthropic, or Google). We operate on a Bring Your
            Own Key (BYOK) model alongside optional bundled credits.
          </p>
          <ul class="list-disc list-inside space-y-2 text-xs sm:text-sm pl-2">
            <li>
              <strong class="text-foreground">BYOK Keys:</strong> When using your
              custom API keys, requests are sent directly or via secure proxy to
              the designated provider. You are responsible for any charges incurred
              directly on your provider account.
            </li>
            <li>
              <strong class="text-foreground">No Model Training:</strong> Nota does
              not train proprietary AI models on your private notes or prompts.
            </li>
            <li>
              <strong class="text-foreground">AI Accuracy:</strong> AI-generated
              outputs are provided for informational and creative assistance. We
              do not guarantee accuracy or completeness of AI outputs.
            </li>
          </ul>
        </div>
      </section>

      <!-- Section 6 -->
      <section
        id="local-first"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >6</span
          >
          Local-First Storage & Offline Use
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            Nota is built with a local-first architecture. Local notes created
            in the Desktop application are stored directly on your computer's
            storage drive.
          </p>
          <p>
            You are responsible for keeping local backups of your local-only
            notes. Nota is not liable for data loss resulting from hardware
            failure, local file deletion, or OS corruption on your local device.
          </p>
        </div>
      </section>

      <!-- Section 7 -->
      <section
        id="billing"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >7</span
          >
          Subscriptions, Payments & Cancellations
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            Pro subscriptions are billed in advance on a recurring monthly or
            yearly cycle. Upgrades take effect immediately, with prorated charge
            adjustments.
          </p>
          <p>
            You may cancel your subscription at any time through your workspace
            settings. Upon cancellation, your subscription remains active until
            the end of the current paid billing period. Payments are
            non-refundable except where mandated by law.
          </p>
        </div>
      </section>

      <!-- Section 8 -->
      <section
        id="prohibited"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >8</span
          >
          Acceptable Use & Prohibited Conduct
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>When using Nota, you agree not to engage in any activity that:</p>
          <ul class="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2">
            <li>
              Violates any local, national, or international law or regulation.
            </li>
            <li>
              Attempts to gain unauthorized access to our servers,
              infrastructure, or other user accounts.
            </li>
            <li>
              Abuses, overloads, or performs reverse engineering on our API
              endpoints or synchronization services.
            </li>
            <li>
              Distributes malware, viruses, or illegal/harmful content via
              shared note previews or workspaces.
            </li>
          </ul>
        </div>
      </section>

      <!-- Section 9 -->
      <section
        id="disclaimers"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >9</span
          >
          Disclaimers & Limitation of Liability
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS
            WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. NOTA DISCLAIMS
            ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            IN NO EVENT SHALL NOTA, ITS AUTHORS, OR AFFILIATES BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF
            DATA, PROFITS, OR BUSINESS OPPORTUNITIES ARISING FROM YOUR USE OF
            THE SERVICE.
          </p>
        </div>
      </section>

      <!-- Section 10 -->
      <section
        id="termination"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >10</span
          >
          Termination & Changes to Terms
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            We reserve the right to modify these Terms at any time. We will
            provide notice of material updates by updating the "Last Updated"
            date at the top of this page. Continued use after changes
            constitutes acceptance.
          </p>
          <p>
            We may suspend or terminate account access for users who breach
            these Terms.
          </p>
        </div>
      </section>

      <!-- Section 11 -->
      <section
        id="contact"
        class="scroll-mt-24 rounded-2xl border bg-primary/5 border-primary/20 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
            >11</span
          >
          Contact Information
        </h2>
        <p class="text-sm sm:text-base text-muted-foreground">
          If you have questions, concerns, or legal inquiries regarding these
          Terms of Service, please reach out to us at:
        </p>
        <div class="mt-4 flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <icons.Mail class="size-5" />
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Legal & Support Email
            </div>
            <a
              href="mailto:contact@nota.ink"
              class="text-base font-semibold text-primary hover:underline"
              >contact@nota.ink</a
            >
          </div>
        </div>
      </section>
    </article>

    <!-- Sticky Table of Contents (Right Side) -->
    <aside class="hidden lg:block lg:col-span-1">
      <div
        class="sticky top-24 rounded-xl border bg-card/60 p-4 backdrop-blur-sm shadow-xs"
      >
        <h3
          class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2"
        >
          Table of Contents
        </h3>
        <nav class="space-y-1 text-sm">
          {#each sections as section}
            <a
              href={`#${section.id}`}
              class="block rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground font-medium"
            >
              {section.title}
            </a>
          {/each}
        </nav>
      </div>
    </aside>
  </div>

  <footer
    class="mt-16 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row"
  >
    <div>© 2026 Nota. All rights reserved.</div>
    <div class="flex items-center gap-4">
      <a href={resolve("/privacy")} class="hover:text-primary transition-colors"
        >Privacy Policy</a
      >
      <span>•</span>
      <a
        href="mailto:contact@nota.ink"
        class="hover:text-primary transition-colors">contact@nota.ink</a
      >
    </div>
  </footer>
</main>
