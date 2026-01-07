<script lang="ts">
import { BorderBeam, SimpleToolTip, ToggleMode } from '@lib/components/custom';
import { toast } from '@lib/components/ui/sonner/index.js';
import { Clipboard, Menu } from '@lucide/svelte';
import BookOpen from '@lucide/svelte/icons/book-open';
import Check from '@lucide/svelte/icons/check';
import Code from '@lucide/svelte/icons/code';
import Github from '@lucide/svelte/icons/github';
import GraduationCap from '@lucide/svelte/icons/graduation-cap';
import GripVertical from '@lucide/svelte/icons/grip-vertical';
import Loader from '@lucide/svelte/icons/loader';
import LogOut from '@lucide/svelte/icons/log-out';
import MousePointerClick from '@lucide/svelte/icons/mouse-pointer-click';
import Pen from '@lucide/svelte/icons/pen';
import PenTool from '@lucide/svelte/icons/pen-tool';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Terminal from '@lucide/svelte/icons/terminal';
import User from '@lucide/svelte/icons/user';
import UserRound from '@lucide/svelte/icons/user-round';
import X from '@lucide/svelte/icons/x';
import Zap from '@lucide/svelte/icons/zap';
import { request } from '@nota/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@nota/ui/shadcn/accordion';
import * as Avatar from '@nota/ui/shadcn/avatar';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Card from '@nota/ui/shadcn/card';
import * as Dropdown from '@nota/ui/shadcn/dropdown-menu';
import * as DropdownMenu from '@nota/ui/shadcn/dropdown-menu';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import ArtifactDownloader from '$lib/artifact/artifact-downloader.svelte';
import MockAiDialog from '$lib/components/custom/landing/mock-ai-dialog.svelte';
import MockBubbleMenu from '$lib/components/custom/landing/mock-bubble-menu.svelte';
import MockDragHandle from '$lib/components/custom/landing/mock-drag-handle.svelte';
import Particles from '$lib/components/custom/utils/particles.svelte';
import Reveal from '$lib/components/custom/utils/reveal.svelte';
import { logout, sendToPaymentPortal } from '$lib/utils.js';
import { getArtefacts } from './data.remote.js';

const { data } = $props();
const user = $derived(data.user);

let tabPro = $state<'monthly' | 'yearly'>('monthly');

const pricingList = {
  free: [
    'All the data is in your local machine',
    'Unlimited Local Notes, Workspaces and UserWorkspaces',
    'Local Media Storage',
    "AI Features with AI Credits (You'd need to logged in and buy AI Credits to use)",
    'Regular Updates and Bug Fixes',
    'Bring your own AI API Key',
  ],
  monthly: [
    'All the features of Free Tier',
    'Unlimited Cloud Notes, Workspaces and UserWorkspaces',
    'Notes collaborate with anyone [Comming Soon]',
    'Notes Previews on Browser',
    '2 Million AI Credits per month (Never Expires)',
    '1 GB Storage for Media Files',
    'All data is encrypted',
    'Priority support and 24/7 help',
  ],
  yearly: [
    'Unlimited Cloud Notes, Workspaces and UserWorkspaces',
    'Notes collaborate with anyone [Comming Soon]',
    'Notes Previews on Browser',
    '25 Million AI Credits at once (Never Expires)',
    '1.5 GB Storage for Media Files',
    'All data is encrypted',
    'Priority support and 24/7 help',
  ],
  ai_credits: [
    'Can be used without any subscription',
    'Even Works for Free Tier Users',
    'Never Expires',
    'Pay as you go',
    'Access to AI Features',
  ],
};

const faqItems = [
  {
    id: 'item-1',
    question: 'Is Nota free to use?',
    answer:
      'Nota is free for local usages. You can simply download the application and use it for free forever for local usage. All your data is stored in your local machine.',
  },
  {
    id: 'item-2',
    question: 'What is bring your own AI API Key?',
    answer:
      'Bring your own AI API Key allows you to use Gemini API Keys with Nota. We do not process your data and store the API key securely.',
  },
  {
    id: 'item-3',
    question: 'What features are included in the Pro plan?',
    answer:
      "Pro plan, comes in monthly or yearly based subscription, allows you to use AI features with AI credits, Cloud Storage to store your notes, workspaces, and userworkspaces. You'll get 1 GB of storage to manage your media on cloud.",
  },
  {
    id: 'item-4',
    question: 'What are AI credits?',
    answer:
      'AI credits are the currency used to access AI features in Nota. You can purchase AI credits to use AI features in Nota. AI credits are used to generate AI content, such as summaries, translations, and more. Usually, these credits are equivalent to tokens.',
  },
  {
    id: 'item-5',
    question: 'Can I use AI without a pro subscription?',
    answer:
      'Yes, You can. Using AI features has nothing to do with having pro plan. You can simply login and buy AI Credits and then you can simply use the AI features.',
  },
];

async function copyToClipboard() {
  toast.promise(navigator.clipboard.writeText('brew install --cask Tsuzat/tap/nota'), {
    loading: 'Copying...',
    success: 'Copied on Clipboard!',
    error: 'Failed to copy',
  });
}
</script>

<Particles className="fixed top-0 -z-10 h-screen w-screen overflow-hidden" />

<header class="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
  <a class="flex items-center gap-4" href={resolve("/")}>
    <enhanced:img src="../../static/favicon.webp" alt="Nota" class="size-10" />
    <h3 class="font-bold">Nota</h3>
  </a>
  <div class="items-center gap-8 hidden sm:inline-flex">
    <a
      class="hover:text-muted-foreground transition-all duration-500"
      href="#features">Features</a
    >
    <a
      class="hover:text-muted-foreground transition-all duration-500"
      href="#solutions">Solutions</a
    >
    <a
      class="hover:text-muted-foreground transition-all duration-500"
      href="#pricing">Pricing</a
    >
    <a
      class="hover:text-muted-foreground transition-all duration-500"
      href="#faqs">FAQs</a
    >
  </div>
  <div class="flex items-center gap-4">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class={buttonVariants({
          variant: "ghost",
          size: "icon-sm",
          class: "sm:hidden",
        })}
      >
        <Menu />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="w-fit">
        <a href="#features">
          <DropdownMenu.Item>Features</DropdownMenu.Item>
        </a>
        <a href="#solutions">
          <DropdownMenu.Item>Solutions</DropdownMenu.Item>
        </a>
        <a href="#pricing">
          <DropdownMenu.Item>Pricing</DropdownMenu.Item>
        </a>
        <a href="#faqs">
          <DropdownMenu.Item>FAQs</DropdownMenu.Item>
        </a>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <ToggleMode />
    {#if user === undefined}
      <Button href={resolve("/login")}>Sign In</Button>
    {:else}
      <Dropdown.Root>
        <Dropdown.Trigger>
          <SimpleToolTip content={user.email}>
            <Avatar.Root
              class={buttonVariants({
                variant: "ghost",
                size: "icon-sm",
                class: "rounded-full",
              })}
            >
              <Avatar.Image src={user.avatarUrl} />
              <Avatar.Fallback>
                <User />
              </Avatar.Fallback>
            </Avatar.Root>
          </SimpleToolTip>
        </Dropdown.Trigger>
        <Dropdown.Content class="w-fit">
          <Dropdown.Label class="text-xs">
            {user.email}
          </Dropdown.Label>
          <Dropdown.Item onclick={() => goto(resolve("/profile"))}>
            <UserRound />
            <span>Profile</span>
          </Dropdown.Item>
          <Dropdown.Item onclick={logout}>
            <LogOut />
            Sign Out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    {/if}
  </div>
</header>

<main
  class="mx-auto flex size-full max-w-4xl flex-col items-center justify-between gap-8 overflow-auto px-4 pt-8"
>
  <span
    class="inline animate-pulse text-2xl font-bold bg-linear-to-r from-[#ff8c00] via-[#7c01ff] to-[#ff7b00] bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent"
  >
    Free. Privacy Focused. Local First
  </span>

  <p class="animate-bounce text-lg">
    A fast, modern note taking app with native AI features
  </p>
  <div class="flex flex-col items-center gap-4 sm:flex-row">
    <Button variant="outline" href={resolve("/playground")}>
      <Pen />
      Playground
    </Button>
    <Button
      variant="outline"
      href="https://github.com/Tsuzat/Nota"
      target="_blank"
    >
      <Github />
      Star us on Github
    </Button>
    {#await getArtefacts()}
      <Button variant="outline">
        <Loader class="animate-spin" />
        Loading
      </Button>
    {:then artefacts}
      {#if artefacts}
        {console.log(artefacts.platforms)}
        <ArtifactDownloader platforms={artefacts.platforms} />
      {:else}
        <Button variant="outline">
          <X />
          No Downloadables
        </Button>
      {/if}
    {:catch error}
      {console.error(error)}
    {/await}
  </div>
  <Button
    variant="outline"
    class="mx-auto relative text-muted-foreground"
    onclick={copyToClipboard}
    title="Click to copy the installation command"
  >
    <BorderBeam />
    $ brew install --cask Tsuzat/tap/nota
  </Button>
  <div class="hidden dark:block">
    <enhanced:img
      class="aspect-auto h-auto w-full"
      src="../../static/previews/dark.webp"
      alt="nota"
    />
  </div>
  <div class="block dark:hidden">
    <enhanced:img
      class="z-10 block aspect-auto h-auto w-full dark:hidden"
      src="../../static/previews/light.webp"
      alt="nota"
    />
  </div>

  <Reveal>
    <section class="flex w-full flex-col gap-8 py-12">
      <h2 class="text-center text-3xl font-bold">Features for Everyone</h2>
      <div class="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Zap class="size-5 text-orange-500" />
              Local First & Private
            </Card.Title>
            <Card.Description>Your data, your control</Card.Description>
          </Card.Header>
          <Card.Content>
            All your data is stored locally on your machine. We never see your
            notes. Truly private by default.
          </Card.Content>
        </Card.Root>
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Code class="size-5 text-blue-500" />
              Bring Your Own Keys
            </Card.Title>
            <Card.Description>Supports Gemini API</Card.Description>
          </Card.Header>
          <Card.Content>
            Connect your own <strong>Gemini</strong> API key. No limits, no subscriptions
            required for AI features.
          </Card.Content>
        </Card.Root>
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Sparkles class="size-5 text-yellow-500" />
              Native AI Features
            </Card.Title>
            <Card.Description>Fast and amazing experience</Card.Description>
          </Card.Header>
          <Card.Content>
            Integrated AI for effortless writing. Summarize, translate, and edit
            with AI directly in your workflow.
          </Card.Content>
        </Card.Root>
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <PenTool class="size-5 text-purple-500" />
              Free Forever
            </Card.Title>
            <Card.Description>For local usage</Card.Description>
          </Card.Header>
          <Card.Content>
            Nota is free for all local usage. Open source and community driven.
            No hidden costs for your local data.
          </Card.Content>
        </Card.Root>
      </div>
    </section>
  </Reveal>

  <Reveal delay={200}>
    <section id="solutions" class="flex w-full flex-col gap-8 py-12">
      <h2 class="text-center text-3xl font-bold">Solutions for Everyone</h2>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="rounded-full bg-blue-500/10 p-4 text-blue-500">
            <Terminal class="size-8" />
          </div>
          <h3 class="text-xl font-semibold">For Developers</h3>
          <p class="text-muted-foreground">
            Manage snippets, document APIs, and keep your technical notes
            organized with syntax highlighting.
          </p>
        </div>
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="rounded-full bg-green-500/10 p-4 text-green-500">
            <BookOpen class="size-8" />
          </div>
          <h3 class="text-xl font-semibold">For Writers</h3>
          <p class="text-muted-foreground">
            Distraction-free writing environment with AI assistance to help you
            overcome writer's block.
          </p>
        </div>
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="rounded-full bg-pink-500/10 p-4 text-pink-500">
            <GraduationCap class="size-8" />
          </div>
          <h3 class="text-xl font-semibold">For Students</h3>
          <p class="text-muted-foreground">
            Take organized lecture notes, summarize complex topics with AI, and
            study more effectively.
          </p>
        </div>
      </div>
    </section>
  </Reveal>

  <Reveal delay={200}>
    <section
      id="features"
      class="flex w-full flex-col gap-12 py-12 md:gap-24 md:py-24"
    >
      <h2 class="text-center text-3xl font-bold tracking-tight md:text-4xl">
        Powerful Editor Features
      </h2>

      <!-- Feature 1: Drag Handle -->
      <div class="flex flex-col items-center gap-12 md:flex-row">
        <div class="flex flex-1 flex-col gap-4">
          <div
            class="flex size-12 items-center justify-center rounded-lg bg-purple-500/10"
          >
            <GripVertical class="size-6 text-purple-500" />
          </div>
          <h3 class="text-2xl font-bold">Smart Drag Handle</h3>
          <p class="text-muted-foreground text-lg">
            Organize your thoughts effortlessly. Drag and drop blocks to
            rearrange content, or click to access quick actions like "Edit with
            AI" and "Turn Into".
          </p>
        </div>
        <div
          class="from-background/50 to-muted/50 flex flex-1 items-center justify-center rounded-2xl border bg-linear-to-br p-8 backdrop-blur-sm"
        >
          <MockDragHandle />
        </div>
      </div>

      <!-- Feature 2: Bubble Menu -->
      <div class="flex flex-col items-center gap-12 md:flex-row-reverse">
        <div class="flex flex-1 flex-col gap-4">
          <div
            class="flex size-12 items-center justify-center rounded-lg bg-blue-500/10"
          >
            <MousePointerClick class="size-6 text-blue-500" />
          </div>
          <h3 class="text-2xl font-bold">Contextual Menu</h3>
          <p class="text-muted-foreground text-lg">
            Everything you need, right where you need it. Highlight text to
            format, add links, or ask AI to improve your writing without losing
            flow.
          </p>
        </div>
        <div
          class="from-background/50 to-muted/50 flex flex-1 items-center justify-center rounded-2xl border bg-linear-to-br p-8 backdrop-blur-sm"
        >
          <MockBubbleMenu />
        </div>
      </div>

      <!-- Feature 3: AI Dialog -->
      <div class="flex flex-col items-center gap-12 md:flex-row">
        <div class="flex flex-1 flex-col gap-4">
          <div
            class="flex size-12 items-center justify-center rounded-lg bg-orange-500/10"
          >
            <Sparkles class="size-6 text-orange-500" />
          </div>
          <h3 class="text-2xl font-bold">Native AI Integration</h3>
          <p class="text-muted-foreground text-lg">
            Bring your own API key for secure, unlimited AI assistance.
            Summarize notes, fix grammar, or generate new content directly in
            your editor.
          </p>
        </div>
        <div
          class="from-background/50 to-muted/50 flex flex-1 items-center justify-center rounded-2xl border bg-linear-to-br p-8 backdrop-blur-sm"
        >
          <MockAiDialog />
        </div>
      </div>
    </section>
  </Reveal>

  <Reveal delay={200}>
    <section id="pricing" class="flex w-full flex-col gap-8 py-12">
      <h2 class="text-center text-3xl font-bold">Simple Pricing</h2>
      <p class="text-center text-muted-foreground">
        Choose the plan that fits your workflow.
      </p>
      <strong class="animate-bounce text-center"
        >Get 10% off on all purchases.</strong
      >

      <div class="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        <!-- Free -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="font-medium">Free</Card.Title>
            <span class="my-3 block text-2xl font-semibold">$0 / mo</span>
          </Card.Header>
          <Card.Content class="space-y-4">
            <hr class="border-dashed" />
            <ul class="list-outside space-y-3 text-sm">
              {#each pricingList.free as item, idx (idx)}
                <li class="flex items-center gap-2">
                  <Check class="size-3!" />
                  {item}
                </li>
              {/each}
            </ul>
          </Card.Content>
          <Card.Footer class="my-auto">
            <Button class="w-full" variant="outline" onclick={copyToClipboard}
              >Install With Homebrew</Button
            >
          </Card.Footer>
        </Card.Root>
        <!-- Monthly -->

        <Card.Root class="relative">
          <BorderBeam />
          <Card.Header>
            <Card.Title class="font-medium flex items-center justify-center">
              <span>Pro</span>
              <div
                class="ml-3 inline-flex items-center rounded-full bg-background"
              >
                <Button
                  class="rounded-full"
                  size="sm"
                  variant={tabPro === "monthly" ? "default" : "ghost"}
                  onclick={() => (tabPro = "monthly")}>Monthly</Button
                >
                <Button
                  class="rounded-full"
                  size="sm"
                  variant={tabPro === "yearly" ? "default" : "ghost"}
                  onclick={() => (tabPro = "yearly")}>Yearly</Button
                >
              </div>
            </Card.Title>
            {#if tabPro === "monthly"}
              <span class="my-3 block text-2xl font-semibold">$5 / mo</span>
            {:else}
              <span class="my-3 block text-2xl font-semibold">
                $4.5 / mo
                <span class="text-lg font-normal text-muted-foreground"
                  >billed $55/y</span
                >
              </span>
            {/if}
          </Card.Header>
          <Card.Content class="space-y-4">
            {@const list =
              tabPro === "monthly" ? pricingList.monthly : pricingList.yearly}
            <hr class="border-dashed" />
            <ul class="list-outside space-y-3 text-sm">
              {#each list as item, idx (idx)}
                <li class="flex items-center gap-2">
                  <Check class="size-3!" />
                  {item}
                </li>
              {/each}
            </ul>
          </Card.Content>
          <Card.Footer>
            <Button
              class="w-full"
              variant="outline"
              onclick={() => {
                if (!user) {
                  return toast.warning("Please login to continue");
                }
                sendToPaymentPortal(tabPro);
              }}
              >Start With {tabPro === "monthly" ? "Monthly" : "Yearly"} Plan</Button
            >
          </Card.Footer>
        </Card.Root>

        <!-- AI Credits -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="font-medium">AI Credits</Card.Title>
            <span class="my-3 block text-2xl font-semibold"
              >$5 / 5M tokens</span
            >
          </Card.Header>
          <Card.Content class="space-y-4">
            <hr class="border-dashed" />
            <ul class="list-outside space-y-3 text-sm">
              {#each pricingList.ai_credits as item, idx (idx)}
                <li class="flex items-center gap-2">
                  <Check class="size-3" />
                  {item}
                </li>
              {/each}
            </ul>
          </Card.Content>
          <Card.Footer class="mt-auto flex flex-col gap-1">
            {#if (user?.aiCredits || 0) <= 0}
              <Button
                class="w-full"
                disabled={!user || user?.aiCredits > 0}
                onclick={() => {
                  toast.promise(
                    request(
                      `${PUBLIC_BACKEND_URL}/api/promotion/redeem-ai-credits`
                    ),
                    {
                      loading: "Redeeming AI Credits...",
                      success: () => {
                        window.location.reload();
                        return "AI Credits redeemed successfully";
                      },
                      error: "Failed to redeem AI Credits",
                    }
                  );
                }}
              >
                {#if !user}
                  Login to claim free AI Credits
                {:else}
                  Claim 10K Free AI Credits
                {/if}
              </Button>
            {/if}
            <Button
              class="w-full"
              variant="outline"
              onclick={() => {
                if (!user) {
                  return toast.warning("Please login to continue");
                }
                sendToPaymentPortal("ai_credits");
              }}>Buy AI Credits</Button
            >
          </Card.Footer>
        </Card.Root>
      </div>
    </section>
  </Reveal>

  <Reveal delay={200}>
    <section id="faqs">
      <div class="mx-auto px-4 md:px-6">
        <div class="mx-auto max-w-xl text-center">
          <h2 class="text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <p class="mt-4 text-balance text-muted-foreground">
            Discover quick and comprehensive answers to common questions about
            our platform, services, and features.
          </p>
        </div>

        <div class="mx-auto mt-12 max-w-2xl">
          <Accordion
            type="single"
            class="w-full rounded-2xl border bg-background px-8 py-3 shadow-sm ring-4 ring-muted dark:ring-0"
          >
            {#each faqItems as item, index (index)}
              <AccordionItem
                value={item.id}
                class={[
                  faqItems.length - 1 !== index
                    ? "border-dashed"
                    : "border-none",
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

          <p class="mt-6 px-4 text-muted-foreground text-center">
            Can't find what you're looking for?
            <a
              href="mailto:contact@nota.ink"
              class="font-medium text-primary hover:underline"
            >
              Contact Us
            </a>
          </p>
        </div>
      </div>
    </section>
  </Reveal>

  <footer
    class="text-muted-foreground flex w-full flex-col items-center justify-between gap-4 border-t py-8 text-sm md:flex-row"
  >
    <p>&copy; {new Date().getFullYear()} Nota. All rights reserved.</p>
    <div class="flex gap-4">
      <a href="/privacy" class="hover:text-foreground transition-colors"
        >Privacy</a
      >
      <a href="/terms" class="hover:text-foreground transition-colors">Terms</a>
      <a
        href="https://github.com/Tsuzat/Nota"
        target="_blank"
        class="hover:text-foreground transition-colors">GitHub</a
      >
    </div>
  </footer>
</main>
