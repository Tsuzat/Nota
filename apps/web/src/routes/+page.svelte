<script lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve */
  // import ArtifactDownloader from '$lib/artifact/artifact-downloader.svelte';
  import ToggleMode from "@lib/components/custom/ToggleMode.svelte";
  import { Button } from "@nota/ui/shadcn/button";
  import Github from "@lucide/svelte/icons/github";
  import LogOut from "@lucide/svelte/icons/log-out";
  import User from "@lucide/svelte/icons/user";
  import UserRound from "@lucide/svelte/icons/user-round";
  import * as Dropdown from "@nota/ui/shadcn/dropdown-menu";
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import Spotlight from "$lib/components/custom/utils/spotlight.svelte";
  // import Particles from '$lib/components/custom/utils/particles.svelte';
  import Reveal from "$lib/components/custom/utils/reveal.svelte";
  import MockDragHandle from "$lib/components/custom/landing/mock-drag-handle.svelte";
  import MockBubbleMenu from "$lib/components/custom/landing/mock-bubble-menu.svelte";
  import MockAiDialog from "$lib/components/custom/landing/mock-ai-dialog.svelte";
  import * as Card from "@nota/ui/shadcn/card";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Code from "@lucide/svelte/icons/code";
  import Zap from "@lucide/svelte/icons/zap";
  import PenTool from "@lucide/svelte/icons/pen-tool";
  import Terminal from "@lucide/svelte/icons/terminal";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import MousePointerClick from "@lucide/svelte/icons/mouse-pointer-click";
  import Pen from "@lucide/svelte/icons/pen";
  import SimpleToolTip from "@lib/components/custom/SimpleToolTip.svelte";
</script>

<!-- <Particles className="fixed top-0 -z-10 h-screen w-screen overflow-hidden" /> -->
<Spotlight />

<header class="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
  <a class="flex items-center gap-4" href={resolve("/")}>
    <img src="/favicon.webp" alt="Nota" class="size-10" />
    <h3 class="font-bold">Nota</h3>
  </a>
  <div class="flex items-center gap-4">
    <SimpleToolTip content="Hello">
      <Button>Hello</Button>
    </SimpleToolTip>
    <ToggleMode />
    <!-- {#if user === null}
			<Button onclick={() => (globalSignInContext.open = true)}>Sign In</Button>
		{:else}
			<Dropdown.Root>
				<Dropdown.Trigger>
					<SimpleTooltip content={user.email}>
						<Button onclick={async () => await auth.signOut()} size="icon" variant="ghost">
							<User />
						</Button>
					</SimpleTooltip>
				</Dropdown.Trigger>
				<Dropdown.Content class="w-fit">
					<Dropdown.Label class="text-xs">
						{user.email}
					</Dropdown.Label>
					<Dropdown.Item onclick={() => goto(resolve('/profile'))}>
						<UserRound />
						<span>Profile</span>
					</Dropdown.Item>
					<Dropdown.Item onclick={() => (useGlobalSettings.open = !useGlobalSettings.open)}>
						<Settings />
						<span>Settings</span>
					</Dropdown.Item>
					<Dropdown.Item
						onclick={() =>
							toast.promise(auth.signOut(), {
								loading: 'Signing you out...',
								success: 'Signed out successfully.',
								error: 'Something went wrong'
							})}
					>
						<LogOut />
						Sign Out
					</Dropdown.Item>
				</Dropdown.Content>
			</Dropdown.Root>
		{/if} -->
  </div>
</header>

<main
  class="mx-auto flex size-full max-w-4xl flex-col items-center justify-between gap-8 overflow-auto px-4 pt-8"
>
  <p class="animate-bounce">
    A fast, modern, feature rich, lightweight and local first note taking
    desktop application
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
    <!-- <ArtifactDownloader /> -->
  </div>
  <img
    class="z-10 hidden aspect-auto h-auto w-full dark:block"
    src="/previews/dark.webp"
    alt="nota"
  />
  <img
    class="z-10 block aspect-auto h-auto w-full dark:hidden"
    src="/previews/light.webp"
    alt="nota"
  />
  <Reveal>
    <section class="flex w-full flex-col gap-8 py-12">
      <h2 class="text-center text-3xl font-bold">Features for Everyone</h2>
      <div class="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Sparkles class="size-5 text-yellow-500" />
              AI Powered
            </Card.Title>
            <Card.Description>Intelligent writing assistance</Card.Description>
          </Card.Header>
          <Card.Content>
            Seamlessly integrate AI into your workflow. Edit with AI, Ask AI,
            generate text, fix grammar, and summarize notes instantly.
          </Card.Content>
        </Card.Root>
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Code class="size-5 text-blue-500" />
              Developer Friendly
            </Card.Title>
            <Card.Description>Built for code</Card.Description>
          </Card.Header>
          <Card.Content>
            First-class support for code blocks, syntax highlighting, and
            developer-focused features like slash commands.
          </Card.Content>
        </Card.Root>
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Zap class="size-5 text-orange-500" />
              Lightning Fast
            </Card.Title>
            <Card.Description>Local-first architecture</Card.Description>
          </Card.Header>
          <Card.Content>
            Experience zero latency with our local-first approach. Your notes
            are stored on your device for instant access.
          </Card.Content>
        </Card.Root>
        <Card.Root class="bg-background/60 backdrop-blur-sm">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <PenTool class="size-5 text-purple-500" />
              Rich Formatting
            </Card.Title>
            <Card.Description>Express yourself</Card.Description>
          </Card.Header>
          <Card.Content>
            Full support for markdown, rich text, images, and more. Customize
            your notes with colors and highlights.
          </Card.Content>
        </Card.Root>
      </div>
    </section>
  </Reveal>

  <Reveal delay={200}>
    <section class="flex w-full flex-col gap-8 py-12">
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

  <Reveal delay={400}>
    <section class="flex w-full flex-col gap-12 py-12 md:gap-24 md:py-24">
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
        href="https://github.com/tsuzat/nota"
        target="_blank"
        class="hover:text-foreground transition-colors">GitHub</a
      >
    </div>
  </footer>
</main>
