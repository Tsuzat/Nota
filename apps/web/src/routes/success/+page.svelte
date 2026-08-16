<script lang="ts">
import ArrowRight from "@lucide/svelte/icons/arrow-right";
import Check from "@lucide/svelte/icons/check";
import CheckCheck from "@lucide/svelte/icons/check-check";
import Copy from "@lucide/svelte/icons/copy";
import CreditCard from "@lucide/svelte/icons/credit-card";
import ExternalLink from "@lucide/svelte/icons/external-link";
import Mail from "@lucide/svelte/icons/mail";
import Sparkles from "@lucide/svelte/icons/sparkles";
import { Button } from "@nota/ui/components/ui/button/index.ts";
import * as Card from "@nota/ui/components/ui/card/index.ts";
import { Separator } from "@nota/ui/components/ui/separator/index.ts";
import { onMount } from "svelte";
import { cubicOut, linear } from "svelte/easing";
import { draw, fade, slide } from "svelte/transition";
import { AppLogo } from "#components/custom/index.ts";
import Particles from "#components/custom/landing/particles.svelte";
import { authClient } from "#lib/auth-client.ts";
import { page } from "$app/state";

let isLoading = $state(true);
let showSuccessAnimation = $state(false);
let showDetails = $state(false);
let isOpeningPortal = $state(false);
let isCopied = $state(false);

const checkout_id = $derived(page.url.searchParams.get("checkout_id"));
const session = authClient.useSession();

type CustomerStateType = Awaited<
	ReturnType<typeof authClient.customer.state>
>["data"];

let customerState = $state<CustomerStateType | null>(null);

const activeSubscription = $derived(
	customerState?.activeSubscriptions?.[0] ?? null,
);

function copyCheckoutId() {
	if (!checkout_id) return;
	navigator.clipboard.writeText(checkout_id);
	isCopied = true;
	setTimeout(() => {
		isCopied = false;
	}, 2000);
}

async function openCustomerPortal() {
	try {
		isOpeningPortal = true;
		await authClient.customer.portal();
	} catch (error) {
		console.error("Failed to open customer portal:", error);
	} finally {
		isOpeningPortal = false;
	}
}

function formatCurrency(amount?: number, currency = "usd") {
	if (amount === undefined || amount === null) return "$0";
	const value = amount > 100 ? amount / 100 : amount;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency.toUpperCase(),
		minimumFractionDigits: value % 1 === 0 ? 0 : 2,
	}).format(value);
}

function formatDate(dateValue?: string | Date | null) {
	if (!dateValue) return "N/A";
	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
	}).format(new Date(dateValue));
}

onMount(async () => {
	try {
		const { data } = await authClient.customer.state();
		if (data) {
			customerState = data;
		}
	} catch (err) {
		console.error("Error fetching polar customer state:", err);
	}

	await new Promise((r) => setTimeout(r, 600));
	isLoading = false;
	showSuccessAnimation = true;

	setTimeout(() => {
		showDetails = true;
	}, 400);
});
</script>

<svelte:head>
  <title>Payment Success | Nota</title>
</svelte:head>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />
<div
  class="relative w-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
>
  <div class="mb-6">
    <AppLogo showLogo={true} />
  </div>

  <Card.Root class="w-full max-w-lg bg-card/50 backdrop-blur-xl border border-border/70 shadow-xl rounded-2xl overflow-hidden">
    <Card.Header class="items-center flex-col text-center space-y-4 pt-8 pb-4">
      <!-- Icon Container: Spinner -> Animated Checkmark -->
      <div class="relative flex items-center justify-center">
        {#if isLoading}
          <div
            class="h-16 w-16 rounded-full border-4 border-muted border-t-emerald-500 animate-spin"
          ></div>
        {:else if showSuccessAnimation}
          <div
            class="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            in:fade={{ duration: 300 }}
          >
            <svg
              class="h-8 w-8 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M20 6L9 17l-5-5"
                in:draw={{ duration: 500, easing: linear }}
              />
            </svg>
          </div>
        {/if}
      </div>

      <!-- Header Text -->
      <div class="space-y-1.5 w-full">
        {#if isLoading}
          <p class="text-muted-foreground text-sm font-medium animate-pulse">
            Verifying your payment...
          </p>
        {:else if showSuccessAnimation}
          <div in:fade={{ duration: 400, easing: cubicOut }} class="space-y-1">
            <Card.Title class="text-2xl font-bold tracking-tight">
              Payment Successful!
            </Card.Title>
            <p class="text-muted-foreground text-sm">
              Thank you for your purchase. Your account has been upgraded.
            </p>
          </div>
        {/if}
      </div>
    </Card.Header>

    {#if showDetails}
      <div in:slide={{ duration: 450, easing: cubicOut }} class="w-full px-6 pb-6 space-y-6">
        
        <!-- Unified Premium Details Card -->
        <div class="rounded-2xl border border-border bg-background/50 backdrop-blur-md overflow-hidden shadow-sm">
          
          <!-- Checkout Reference (Only shows if present) -->
          {#if checkout_id}
            <div class="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border/60">
              <span class="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                <CreditCard class="h-4 w-4" />
                Checkout Ref
              </span>
              <button
                type="button"
                onclick={copyCheckoutId}
                class="inline-flex items-center gap-1.5 font-mono text-xs bg-background hover:bg-muted/50 px-2.5 py-1 rounded border border-border/60 transition-all group cursor-pointer text-foreground shadow-sm"
                title="Click to copy"
              >
                <span>{checkout_id.length > 16 ? `${checkout_id.slice(0, 8)}...${checkout_id.slice(-6)}` : checkout_id}</span>
                {#if isCopied}
                  <CheckCheck class="h-3.5 w-3.5 text-emerald-500" />
                {:else}
                  <Copy class="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {/if}
              </button>
            </div>
          {/if}

          <!-- Main Info Grid -->
          <div class="p-5 space-y-4">
            
            <!-- Plan Row -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5 text-muted-foreground">
                <div class="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles class="h-4 w-4 text-emerald-500" />
                </div>
                <span class="text-sm font-medium">Plan</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-foreground text-sm">
                  {activeSubscription ? "Pro Plan" : "Nota Pro"}
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>

            <Separator class="bg-border/60" />

            <!-- Account Row -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5 text-muted-foreground">
                <div class="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50 border border-border/50">
                  <Mail class="h-4 w-4 text-foreground/70" />
                </div>
                <span class="text-sm font-medium">Account</span>
              </div>
              <span class="text-foreground text-sm font-medium truncate max-w-[200px] sm:max-w-xs">
                {$session.data?.user?.email ?? customerState?.email ?? "Your account"}
              </span>
            </div>

            <!-- Optional: Price & Next Renewal (Only if we have activeSubscription) -->
            {#if activeSubscription}
              <Separator class="bg-border/60" />
              
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground text-sm font-medium ml-[38px]">
                  Billing
                </span>
                <span class="font-semibold text-foreground text-sm">
                  {formatCurrency(activeSubscription.amount, activeSubscription.currency)}
                  <span class="text-muted-foreground font-normal text-xs">
                    /{activeSubscription.recurringInterval ?? "month"}
                  </span>
                </span>
              </div>

              {#if activeSubscription.currentPeriodEnd}
                <div class="flex items-center justify-between mt-2">
                  <span class="text-muted-foreground text-sm font-medium ml-[38px]">
                    Next Renewal
                  </span>
                  <span class="text-foreground text-sm font-medium">
                    {formatDate(activeSubscription.currentPeriodEnd)}
                  </span>
                </div>
              {/if}
            {/if}

          </div>

          <!-- Features list / Unlocked perks -->
          <div class="bg-emerald-500/5 border-t border-emerald-500/10 p-5">
            <h4 class="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-sm mb-3">
              <Check class="h-4 w-4" />
              What's included in your subscription:
            </h4>
            <ul class="space-y-2 text-muted-foreground text-sm pl-6 list-disc marker:text-emerald-500/50">
              <li>Unlimited notes and real-time multi-device sync</li>
              <li>End-to-end encrypted cloud backup</li>
              <li>Advanced AI search and workspace tools</li>
            </ul>
          </div>
        </div>

        <p class="text-center text-xs text-muted-foreground">
          A receipt and subscription details have also been sent to your email.
        </p>

        <!-- Actions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            onclick={openCustomerPortal}
            disabled={isOpeningPortal}
          >
            <span>{isOpeningPortal ? "Opening portal..." : "Manage Billing"}</span>
            <ExternalLink class="h-4 w-4" />
          </Button>

          <Button href="/dashboard" >
            <span>Go to Dashboard</span>
            <ArrowRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    {/if}
  </Card.Root>
</div>
