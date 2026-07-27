<script lang="ts">
import ToggleMode from '@nota/ui/custom/ToggleMode.svelte';
import { icons } from '@nota/ui/icons';
import { Button } from '@nota/ui/shadcn/button';
import { resolve } from '$app/paths';
import AppLogo from '$lib/components/custom/applogo.svelte';
import Particles from '$lib/components/custom/landing/particles.svelte';

const lastUpdated = 'July 26, 2026';

const sections = [
  { id: 'philosophy', title: '1. Our Privacy Philosophy' },
  { id: 'information-collected', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Information' },
  { id: 'ai-privacy', title: '4. AI Processing & Third-Party Providers' },
  { id: 'local-first-data', title: '5. Local Notes & Offline Isolation' },
  { id: 'security', title: '6. Data Security & Encryption' },
  { id: 'retention', title: '7. Data Retention & Account Deletion' },
  { id: 'cookies', title: '8. Cookies & Local Storage' },
  { id: 'your-rights', title: '9. Your Privacy Rights (GDPR & CCPA)' },
  { id: 'children', title: "10. Children's Privacy" },
  { id: 'contact', title: '11. Contact Us' },
];
</script>

<svelte:head>
  <title>Privacy Policy | Nota — Local-First Note-Taking App</title>
  <meta
    name="description"
    content="Learn how Nota protects your data and privacy with local-first notes, zero third-party ad tracking, encrypted cloud sync, and BYOK AI models."
  />
  <link rel="canonical" href="https://nota.ink/privacy" />
  <meta
    name="robots"
    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://nota.ink/privacy" />
  <meta
    property="og:title"
    content="Privacy Policy | Nota — Local-First Note-Taking App"
  />
  <meta
    property="og:description"
    content="Learn how Nota protects your data and privacy with local-first notes, zero third-party ad tracking, encrypted cloud sync, and BYOK AI models."
  />
  <meta property="og:site_name" content="Nota" />
  <meta property="og:image" content="https://nota.ink/previews/dark.webp" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://nota.ink/privacy" />
  <meta name="twitter:title" content="Privacy Policy | Nota" />
  <meta
    name="twitter:description"
    content="Learn how Nota protects your data and privacy with local-first notes, zero ad tracking, and BYOK AI features."
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
          "@id": "https://nota.ink/privacy",
          "url": "https://nota.ink/privacy",
          "name": "Privacy Policy | Nota",
          "description": "Privacy Policy for Nota note-taking application.",
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
              "name": "Privacy Policy",
              "item": "https://nota.ink/privacy"
            }
          ]
        }
      ]
    }
  </script>
</svelte:head>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />

<header
  class="sticky top-0 z-50 mx-auto flex max-w-5xl items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8"
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
      class="inline-flex items-center gap-2 rounded-full border bg-emerald-500/10 border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-4"
    >
      <icons.ShieldCheck class="size-3.5" />
      <span>Privacy First</span>
    </div>
    <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
      Privacy Policy
    </h1>
    <p class="mt-3 text-base text-muted-foreground sm:text-lg">
      Your privacy is central to how we build Nota. Last updated: <span
        class="font-semibold text-foreground">{lastUpdated}</span
      >.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-10 lg:grid-cols-4">
    <!-- Main Content -->
    <article class="lg:col-span-3 space-y-10 text-foreground leading-relaxed">
      <!-- Section 1 -->
      <section
        id="philosophy"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >1</span
          >
          Our Privacy Philosophy
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            At Nota, we believe note-taking software should respect your
            privacy. Notes represent your thoughts, ideas, calculations, and
            personal projects.
          </p>
          <p>
            We adhere to two core design principles: <strong
              class="text-foreground">Local-First Privacy</strong
            >
            and <strong class="text-foreground">Data Transparency</strong>. We
            do not sell your personal data, we do not show advertisements, and
            we do not train artificial intelligence models on your private note
            content.
          </p>
        </div>
      </section>

      <!-- Section 2 -->
      <section
        id="information-collected"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >2</span
          >
          Information We Collect
        </h2>
        <div class="space-y-4 text-sm sm:text-base text-muted-foreground">
          <p>We collect information depending on how you choose to use Nota:</p>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl border bg-muted/30 p-4 space-y-2">
              <h4
                class="font-semibold text-foreground text-sm flex items-center gap-2"
              >
                <icons.User class="size-4 text-primary" />
                Account & Auth Data
              </h4>
              <p class="text-xs text-muted-foreground">
                Email address, profile name, avatar URL, and session tokens
                created during registration or sign-in.
              </p>
            </div>

            <div class="rounded-xl border bg-muted/30 p-4 space-y-2">
              <h4
                class="font-semibold text-foreground text-sm flex items-center gap-2"
              >
                <icons.Cloud class="size-4 text-primary" />
                Cloud-Synced Content
              </h4>
              <p class="text-xs text-muted-foreground">
                Notes, workspaces, and media explicitly saved to cloud
                workspaces for synchronization and collaboration across devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3 -->
      <section
        id="how-we-use"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >3</span
          >
          How We Use Information
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            We utilize the collected information strictly for the following
            purposes:
          </p>
          <ul class="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2">
            <li>
              Authenticating your identity and managing your workspace
              permissions.
            </li>
            <li>
              Synchronizing your cloud notes and media files across your
              registered devices.
            </li>
            <li>
              Enabling realtime collaboration when working in shared workspaces.
            </li>
            <li>
              Processing payments and managing Pro subscription billing via
              secure payment gateways.
            </li>
            <li>
              Fulfilling AI assistant requests when explicitly triggered by you.
            </li>
          </ul>
        </div>
      </section>

      <!-- Section 4 -->
      <section
        id="ai-privacy"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >4</span
          >
          AI Processing & Third-Party Providers
        </h2>
        <div class="space-y-4 text-sm sm:text-base text-muted-foreground">
          <p>
            Nota offers AI editing capabilities (summarization, text generation,
            math solving). When you invoke AI tools:
          </p>
          <div class="rounded-xl border bg-muted/40 p-4 space-y-3">
            <ul class="list-disc list-inside space-y-2 text-xs sm:text-sm">
              <li>
                <strong class="text-foreground"
                  >Bring Your Own Key (BYOK):</strong
                > If you supply an API key (e.g. OpenAI, Anthropic, Google), requests
                are routed through API calls authenticated by your key. Your custom
                keys are stored encrypted on your device.
              </li>
              <li>
                <strong class="text-foreground"
                  >No Third-Party Model Training:</strong
                > Prompt text sent to supported model APIs is processed solely to
                generate your requested response. We specify zero-retention flags
                where supported by providers.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Section 5 -->
      <section
        id="local-first-data"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >5</span
          >
          Local Notes & Offline Isolation
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            Notes stored in <strong class="text-foreground"
              >Local Workspaces</strong
            > on the Nota Desktop app reside purely on your computer's local file
            system.
          </p>
          <p>
            Local notes, local media attachments, and offline drafts are never
            transmitted to our cloud servers. You maintain total offline control
            over these files.
          </p>
        </div>
      </section>

      <!-- Section 6 -->
      <section
        id="security"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >6</span
          >
          Data Security & Encryption
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            We implement industry-standard security measures to safeguard your
            information:
          </p>
          <ul class="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2">
            <li>
              <strong class="text-foreground">In Transit:</strong> All data exchanged
              between Nota clients and servers is encrypted using modern TLS (Transport
              Layer Security).
            </li>
            <li>
              <strong class="text-foreground">At Rest:</strong> Cloud databases and
              database backups employ AES-256 encryption.
            </li>
            <li>
              <strong class="text-foreground">Session Protection:</strong> Auth tokens
              are securely stored using HTTP-only cookies and OS keychain storage
              mechanisms where available.
            </li>
          </ul>
        </div>
      </section>

      <!-- Section 7 -->
      <section
        id="retention"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >7</span
          >
          Data Retention & Account Deletion
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            We retain cloud-synced data for as long as your account remains
            active. You may export your notes at any time in standard Markdown,
            JSON, or media formats.
          </p>
          <p>
            If you decide to delete your account, all cloud workspaces, cloud
            notes, and personal metadata associated with your account will be
            permanently erased from our primary databases.
          </p>
        </div>
      </section>

      <!-- Section 8 -->
      <section
        id="cookies"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >8</span
          >
          Cookies & Local Storage
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            Nota uses essential session cookies and local browser storage
            strictly for application functionality (keeping you signed in,
            storing theme preferences like Light/Dark mode, and caching local
            editor state). We do not use third-party tracking cookies or
            advertising pixels.
          </p>
        </div>
      </section>

      <!-- Section 9 -->
      <section
        id="your-rights"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >9</span
          >
          Your Privacy Rights (GDPR & CCPA)
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            Depending on your location, you have rights under regulations like
            GDPR or CCPA, including:
          </p>
          <ul class="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2">
            <li>
              <strong class="text-foreground">Right of Access:</strong> Request a
              copy of the cloud personal data we hold about you.
            </li>
            <li>
              <strong class="text-foreground">Right to Rectification:</strong> Correct
              inaccurate or incomplete account details.
            </li>
            <li>
              <strong class="text-foreground">Right to Erasure:</strong> Request
              the deletion of your cloud data.
            </li>
            <li>
              <strong class="text-foreground">Right to Portability:</strong> Export
              your notes in standard open formats.
            </li>
          </ul>
        </div>
      </section>

      <!-- Section 10 -->
      <section
        id="children"
        class="scroll-mt-24 rounded-2xl border bg-card/40 p-6 sm:p-8 backdrop-blur-xs"
      >
        <h2
          class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-4"
        >
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >10</span
          >
          Children's Privacy
        </h2>
        <div class="space-y-3 text-sm sm:text-base text-muted-foreground">
          <p>
            Nota is not directed to children under 13 years of age. We do not
            knowingly collect personal information from children. If you become
            aware that a child has provided us with personal data, please
            contact us immediately.
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
          Contact Us
        </h2>
        <p class="text-sm sm:text-base text-muted-foreground">
          If you have questions, feedback, or data privacy requests regarding
          this Privacy Policy, please contact our Privacy Team at:
        </p>
        <div class="mt-4 flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <icons.Mail class="size-5" />
          </div>
          <div>
            <div class="text-xs text-muted-foreground">
              Privacy Concerns & Data Inquiries
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
      <a href={resolve("/terms")} class="hover:text-primary transition-colors"
        >Terms of Service</a
      >
      <span>•</span>
      <a
        href="mailto:contact@nota.ink"
        class="hover:text-primary transition-colors">contact@nota.ink</a
      >
    </div>
  </footer>
</main>
