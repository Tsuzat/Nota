<script lang="ts">
import ArrowLeft from "@lucide/svelte/icons/arrow-left";
import Check from "@lucide/svelte/icons/check";
import X from "@lucide/svelte/icons/x";
import { Button } from "@nota/ui/shadcn/button/index.js";
import Particles from "#components/custom/landing/particles.svelte";
import { Pricing } from "#components/custom/landing/pricing/index.js";

const features = [
	{
		name: "Local notes & workspaces",
		free: "Unlimited",
		pro: "Unlimited",
		credits: "—",
	},
	{ name: "Cloud workspaces", free: "1", pro: "Unlimited", credits: "—" },
	{ name: "Cloud notes", free: "5", pro: "Unlimited", credits: "—" },
	{ name: "Cloud storage", free: "100MB", pro: "5GB", credits: "—" },
	{
		name: "Media storage",
		free: "Local only",
		pro: "Cloud + local",
		credits: "—",
	},
	{
		name: "Collaboration",
		free: "Local only",
		pro: "Full (cloud collaborative notes)",
		credits: "—",
	},
	{ name: "PDF export", free: "no", pro: "yes", credits: "—" },
	{
		name: "Cloud snapshots (auto + manual)",
		free: "no",
		pro: "yes",
		credits: "—",
	},
	{
		name: "Browser previews / web access",
		free: "no",
		pro: "yes",
		credits: "—",
	},
	{ name: "Encrypted data", free: "Local only", pro: "yes", credits: "—" },
	{ name: "Notes backup", free: "Local only", pro: "Cloud", credits: "—" },
	{
		name: "AI usage",
		free: "BYOK, or buy credits",
		pro: "BYOK, or buy credits",
		credits: "Deducted from credit balance",
	},
	{
		name: "AI pricing (if not BYOK)",
		free: "Pay-as-you-go, from $5",
		pro: "Pay-as-you-go, from $5",
		credits: "Pay-as-you-go, from $5",
	},
	{
		name: "App access",
		free: "Local app only",
		pro: "Full (web + desktop)",
		credits: "—",
	},
	{ name: "Updates & bug fixes", free: "yes", pro: "yes", credits: "—" },
];
</script>

<svelte:head>
  <title>Nota Pricing & Plans</title>
  <meta
    name="description"
    content="Compare Nota's Free and Pro plans, and learn about our flexible pay-as-you-go AI Credits."
  />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Nota Pricing & Plans" />
  <meta
    property="og:description"
    content="Compare Nota's Free and Pro plans, and learn about our flexible pay-as-you-go AI Credits."
  />
  <meta property="og:site_name" content="Nota" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="https://nota.ink/pricing" />
</svelte:head>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />

<main
  class="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-10 pb-20 sm:px-6 lg:px-8"
>
  <div class="mb-6 text-center relative z-20">
    <Button
      variant="ghost"
      href="/"
      class="inline-flex items-center text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="mr-2 size-4" />
      Back to Home
    </Button>
  </div>

  <section class="mb-24 relative z-10">
    <Pricing />
  </section>

  <section class="mx-auto w-full max-w-5xl relative z-10">
    <div class="mb-14 text-center">
      <h1>
        <span
          class="animate-pulse bg-linear-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent pb-2"
        >
          Compare Features
        </span>
      </h1>
      <p
        class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        Detailed breakdown of everything included in Free, Pro, and our flexible
        AI Credits system.
      </p>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-border/50 bg-background/40 shadow-2xl backdrop-blur-xl"
    >
      <div class="overflow-x-auto max-h-[70vh] custom-scrollbar">
        <table class="w-full text-left text-sm border-collapse">
          <thead
            class="sticky top-0 z-30 shadow-xs backdrop-blur-xl bg-background/90"
          >
            <tr>
              <th
                scope="col"
                class="min-w-56 p-6 font-semibold text-muted-foreground sticky left-0 z-40 bg-background/90 backdrop-blur-xl border-r border-border/50 border-b"
              >
                Feature Overview
              </th>
              <th
                scope="col"
                class="min-w-40 p-6 font-bold text-lg border-b border-border/50 bg-transparent"
                >Free</th
              >
              <th
                scope="col"
                class="min-w-44 p-6 font-bold text-lg text-primary border-b border-primary/20 bg-primary/5 dark:bg-primary/10 relative"
              >
                <!-- Glowing top edge for Pro column -->
                <div
                  class="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-primary to-transparent opacity-50"
                ></div>
                Pro
                <span
                  class="ml-2 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-primary shadow-sm shadow-primary/20"
                >
                  Popular
                </span>
              </th>
              <th
                scope="col"
                class="min-w-40 p-6 font-bold text-lg border-b border-border/50 bg-transparent"
                >AI Credits</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-border/50">
            <tr class="group hover:bg-muted/30 transition-colors duration-300">
              <td
                class="p-6 font-medium sticky left-0 z-10 bg-background/90 group-hover:bg-muted/80 backdrop-blur-xl border-r border-border/50 transition-colors duration-300"
              >
                Price
              </td>
              <td class="p-6 text-base font-semibold">$0/year</td>
              <td
                class="p-6 text-base font-semibold text-primary bg-primary/5 dark:bg-primary/10 border-x border-primary/10"
              >
                $5/month or $50/year
              </td>
              <td class="p-6 text-base font-medium text-muted-foreground"
                >Pay-as-you-go, from $5</td
              >
            </tr>
            {#each features as feature}
              <tr
                class="group hover:bg-muted/30 transition-colors duration-300"
              >
                <td
                  class="p-6 font-medium text-foreground sticky left-0 z-10 bg-background/90 group-hover:bg-muted/80 backdrop-blur-xl border-r border-border/50 transition-colors duration-300"
                >
                  {feature.name}
                </td>
                <td class="p-6">
                  {#if feature.free === "yes"}
                    <Check
                      class="size-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    />
                  {:else if feature.free === "no"}
                    <X class="size-5 text-muted-foreground/30" />
                  {:else}
                    <span
                      class={feature.free === "—"
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground font-medium"}
                    >
                      {feature.free}
                    </span>
                  {/if}
                </td>
                <td
                  class="p-6 bg-primary/5 dark:bg-primary/10 border-x border-primary/10 relative"
                >
                  {#if feature.pro === "yes"}
                    <Check class="size-6 text-primary drop-shadow-md" />
                  {:else if feature.pro === "no"}
                    <X class="size-5 text-muted-foreground/30" />
                  {:else}
                    <span
                      class={feature.pro === "—"
                        ? "text-muted-foreground/50"
                        : "text-primary/90 font-medium"}
                    >
                      {feature.pro}
                    </span>
                  {/if}
                </td>
                <td class="p-6">
                  {#if feature.credits === "yes"}
                    <Check
                      class="size-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    />
                  {:else if feature.credits === "no"}
                    <X class="size-5 text-muted-foreground/30" />
                  {:else}
                    <span
                      class={feature.credits === "—"
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground font-medium"}
                    >
                      {feature.credits}
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
          <tfoot
            class="sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-xl bg-background/90 border-t border-border/50"
          >
            <tr>
              <td
                class="p-6 sticky left-0 z-40 bg-background/90 backdrop-blur-xl border-r border-border/50"
              ></td>
              <td class="p-6">
                <Button
                  variant="outline"
                  class="w-full transition-all duration-300 hover:bg-muted/80"
                  onclick={() =>
                    window.navigator.clipboard.writeText(
                      "brew install --cask Tsuzat/tap/nota",
                    )}
                >
                  Copy Brew Command
                </Button>
              </td>
              <td
                class="p-6 bg-primary/5 dark:bg-primary/10 border-x border-primary/10 relative"
              >
                <Button
                  class="w-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300"
                >
                  Get Started
                </Button>
              </td>
              <td class="p-6">
                <Button
                  variant="secondary"
                  class="w-full transition-all duration-300 hover:bg-secondary/80"
                >
                  Buy AI Credits
                </Button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</main>

<style>
  /* Custom scrollbar for the table wrapper to look premium */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--color-border, #333);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }
</style>
