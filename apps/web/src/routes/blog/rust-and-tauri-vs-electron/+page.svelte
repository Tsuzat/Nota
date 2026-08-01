<script lang="ts">
import { icons } from '@nota/ui/icons';
import { Button } from '@nota/ui/shadcn/button';
import { resolve } from '$app/paths';
import BlogArticleShell from '$lib/components/custom/blog-article-shell.svelte';
import { copyArticleLink } from '$lib/utils/blog';
</script>

<svelte:head>
	<title>Why We Built Nota with Rust & Tauri Instead of Electron | Nota Blog</title>
	<meta
		name="description"
		content="Electron apps devour RAM and drain laptop batteries. Discover how building our desktop engine with Rust and Tauri reduced memory usage by 80% with instantaneous cold starts."
	/>
	<meta
		name="keywords"
		content="Rust vs Electron, Tauri vs Electron, Rust note taking app, Tauri desktop app, lightweight note taking app, fast markdown editor, Raycast alternative note app, memory efficient note app, native desktop apps"
	/>
	<meta name="author" content="The Nota Engineering Team" />
	<link rel="canonical" href="https://nota.ink/blog/rust-and-tauri-vs-electron" />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://nota.ink/blog/rust-and-tauri-vs-electron" />
	<meta
		property="og:title"
		content="Why We Built Nota with Rust & Tauri Instead of Electron"
	/>
	<meta
		property="og:description"
		content="Discover how building our desktop engine with Rust and Tauri reduced memory usage by 80% with instantaneous sub-50ms cold starts."
	/>
	<meta property="og:site_name" content="Nota" />
	<meta property="og:image" content="https://nota.ink/previews/dark.webp" />
	<meta property="article:published_time" content="2026-07-24T00:00:00Z" />
	<meta property="article:modified_time" content="2026-07-24T00:00:00Z" />
	<meta property="article:section" content="Architecture & Performance" />
	<meta property="article:author" content="The Nota Engineering Team" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Why We Built Nota with Rust & Tauri Instead of Electron"
	/>
	<meta
		name="twitter:description"
		content="How building our desktop engine with Rust and Tauri cut memory usage by 80% over typical Electron apps."
	/>
	<meta name="twitter:image" content="https://nota.ink/previews/dark.webp" />

	<!-- Schema.org TechArticle JSON-LD -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "TechArticle",
			"mainEntityOfPage": {
				"@type": "WebPage",
				"@id": "https://nota.ink/blog/rust-and-tauri-vs-electron"
			},
			"headline": "Why We Built Nota with Rust and Tauri Instead of Electron",
			"image": "https://nota.ink/previews/dark.webp",
			"datePublished": "2026-07-24T00:00:00Z",
			"dateModified": "2026-07-24T00:00:00Z",
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
			"description": "An architectural breakdown of why Nota utilizes a native Rust and Tauri daemon over Google's Electron webview runtime to maximize desktop battery life and RAM efficiency."
		}
	</script>
</svelte:head>

<BlogArticleShell headerSubtitle="Architecture">
	<header class="mb-10 text-left">
		<div class="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
			<span
				class="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-blue-500"
			>
				Architecture & Performance
			</span>
			<span class="rounded-full bg-muted px-3 py-1 text-muted-foreground">6 min read</span>
			<span class="text-muted-foreground">• July 24, 2026</span>
		</div>
		<h1
			class="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground text-balance leading-tight"
		>
			Why We Built Nota with Rust and Tauri Instead of Electron
		</h1>
		<p class="mt-4 text-lg sm:text-xl text-muted-foreground leading-relaxed text-balance">
			When we started designing a modern note-taking client, our hardest engineering constraint was
			simple: it must open faster than your thoughts can escape. Here is why choosing Electron would
			have doomed that mission.
		</p>
		<div class="mt-6 flex items-center justify-between border-y py-4 text-sm text-muted-foreground">
			<span class="font-semibold text-foreground">By The Nota Engineering Team</span>
			<Button
				variant="outline"
				size="sm"
				onclick={copyArticleLink}
				class="h-8 rounded-full text-xs gap-1.5"
			>
				<icons.Link class="size-3" />
				Copy Link
			</Button>
		</div>
	</header>

	<article class="space-y-6 text-base sm:text-lg leading-relaxed text-foreground/90">
		<p>
			In modern software engineering, developers often default to Electron for desktop development
			because it bridges web code directly to desktop binaries. However, this ease of distribution
			comes with an onerous hidden tax: shipping an entire embedded Chromium web browser and Node.js
			runtime inside every application.
		</p>
		<h2 class="text-2xl font-bold text-foreground mt-8 border-b pb-2">
			The Electron Memory Bloat Problem
		</h2>
		<p>
			When a user simultaneously keeps a chat application, a code editor, a project board, and a
			note-taking tool open—all built on Electron—system RAM consumption easily surpasses 3 gigabytes
			simply to maintain idle interfaces. For laptop users away from a power outlet, this sustained
			background processing triggers CPU throttling and accelerates battery depletion.
		</p>
		<h2 class="text-2xl font-bold text-foreground mt-8 border-b pb-2">Enter Rust & Tauri</h2>
		<p>
			Instead of shipping Chromium, <a
				href="https://tauri.app/"
				target="_blank"
				class="text-primary font-medium hover:underline">Tauri</a
			> leverages the host operating system's native webview renderer (WKWebView on macOS, WebView2 on
			Windows, and WebKit on Linux). This architectural shift immediately shrinks download installers from
			150 megabytes down to under 15 megabytes.
		</p>
		<p>
			Under the hood, Nota handles local file system read/write pipelines, SQLite database
			transactions, and file encryption natively within safe, highly optimized <strong
				>Rust threads</strong
			>. When you hit a global shortcut to capture a quick note, the app window mounts
			instantaneously—clocking under 50 milliseconds from invocation to an active text cursor.
		</p>
		<div class="rounded-xl border bg-muted/30 p-6 my-8">
			<h3 class="text-lg font-bold text-foreground m-0">Key Performance Wins:</h3>
			<ul class="mt-3 space-y-2 list-disc pl-5 text-sm sm:text-base text-muted-foreground">
				<li>
					<strong>80% reduction in average RAM usage</strong> (~45 MB vs ~400 MB in comparable tools).
				</li>
				<li>
					<strong>Sub-50ms cold start execution</strong>, rivaling native utilities like Apple Notes
					or Raycast.
				</li>
				<li>
					<strong>Zero cross-platform compromises</strong>, maintaining identical rich Tiptap
					formatting across desktop and web browser instances.
				</li>
			</ul>
		</div>
	</article>

	<section class="mt-16 rounded-xl border bg-card p-8 text-center shadow-xs">
		<h3 class="text-2xl font-bold text-foreground">Experience Native Desktop Speed</h3>
		<p class="mt-2 text-muted-foreground text-sm">
			Download the lightweight Tauri app for macOS, Windows, or Linux today.
		</p>
		<div class="mt-6 flex justify-center gap-3">
			<Button href={resolve("/#pricing")} class="rounded-full px-8 font-semibold">
				Try Nota Free
			</Button>
		</div>
	</section>
</BlogArticleShell>
