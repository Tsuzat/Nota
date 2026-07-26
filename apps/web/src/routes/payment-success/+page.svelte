<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import Applogo from "$lib/components/custom/applogo.svelte";
  import { Button } from "@lib/components/ui/button";
  import * as Card from "@lib/components/ui/card";
  import { Separator } from "@lib/components/ui/separator";
  import { getAuthContext, type CheckoutDetails } from "@nota/client";
  import { onMount } from "svelte";
  import { draw, fade, slide } from "svelte/transition";
  import { cubicOut, linear } from "svelte/easing";
  import Particles from "$lib/components/custom/landing/particles.svelte";

  const authClient = getAuthContext();

  let isLoading = $state(true);
  let showSuccessAnimation = $state(false);
  let showDetails = $state(false);
  let checkoutDetails = $state<CheckoutDetails | null>(null);

  const checkoutId = $derived(page.url.searchParams.get("checkout_id"));

  onMount(async () => {
    if (!checkoutId) {
      isLoading = false;
      return;
    }

    const startTime = Date.now();
    try {
      checkoutDetails = await authClient.getCheckoutDetails(checkoutId);
    } catch (err) {
      console.error("Failed to fetch checkout details:", err);
      checkoutDetails = null;
    }

    // Ensure minimum loading time for smooth visual feedback
    const elapsedTime = Date.now() - startTime;
    const minLoadingTime = 800;
    if (elapsedTime < minLoadingTime) {
      await new Promise((r) => setTimeout(r, minLoadingTime - elapsedTime));
    }

    isLoading = false;

    if (checkoutDetails) {
      showSuccessAnimation = true;
      // Trigger details fade in after checkmark draws
      setTimeout(() => {
        showDetails = true;
      }, 500);
    }
  });

  function formatDate(dateInput?: Date | string | null) {
    const date = dateInput ? new Date(dateInput) : new Date();
    return date
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  }
</script>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />
<div
  class="relative w-full min-h-screen flex flex-col items-center justify-center p-4"
>
  <div class="mb-6">
    <Applogo showLogo={true} />
  </div>

  {#if isLoading || checkoutDetails}
    <Card.Root class="w-full max-w-105 bg-muted/50 border shadow-sm">
      <Card.Header class="items-center flex-col text-center space-y-4 pt-8">
        <!-- Icon Container: Spinner -> Checkmark -->
        <div class="relative flex items-center justify-center mb-2">
          {#if isLoading}
            <div
              class="h-16 w-16 rounded-full border-4 border-muted border-t-emerald-500 animate-spin"
            ></div>
          {:else if showSuccessAnimation}
            <div
              class="h-16 w-16 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-transparent"
            >
              <svg
                class="h-7 w-7 text-emerald-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3.5"
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
        <div class="space-y-2 w-full">
          {#if isLoading}
            <p class="text-muted-foreground text-sm font-medium animate-pulse">
              Verifying your order...
            </p>
          {:else if showSuccessAnimation}
            <div in:fade={{ duration: 400, easing: cubicOut }}>
              <Card.Title
                class="text-[22px] font-bold tracking-tight leading-snug px-4"
              >
                Your order has been<br />successfully submitted
              </Card.Title>
            </div>
          {/if}
        </div>
      </Card.Header>

      {#if showDetails && checkoutDetails}
        <div in:slide={{ duration: 500, easing: linear }}>
          <Card.Content class="space-y-0 text-sm mt-4 px-8">
            <!-- Order ID -->
            <div
              class="flex items-center justify-between py-4 text-muted-foreground"
            >
              <span class="font-medium">Order ID</span>
              <span class="font-medium text-foreground">
                {checkoutDetails.id
                  ? checkoutDetails.id.split("-").pop()
                  : "57625869"}
              </span>
            </div>
            <Separator />

            <!-- Payment Method -->
            <div
              class="flex items-center justify-between py-4 text-muted-foreground"
            >
              <span class="font-medium">Payment Method</span>
              <span class="font-medium text-foreground">
                {checkoutDetails.payment_method || "Apple Pay"}
              </span>
            </div>
            <Separator />

            <!-- Date & Time -->
            <div
              class="flex items-center justify-between py-4 text-muted-foreground"
            >
              <span class="font-medium">Date & Time</span>
              <span class="font-medium text-foreground">
                {formatDate(checkoutDetails.created_at)}
              </span>
            </div>
            <Separator />

            <!-- Total -->
            <div class="flex items-center justify-between py-5">
              <span class="font-bold text-base tracking-wide text-foreground"
                >Total</span
              >
              <span class="font-bold text-xl tracking-tight text-foreground">
                $ {checkoutDetails.amount
                  ? (checkoutDetails.amount / 100).toFixed(0)
                  : "129"}
              </span>
            </div>
          </Card.Content>
        </div>

        <div in:slide={{ duration: 500, delay: 100, easing: cubicOut }}>
          <Card.Footer class="pb-8 px-8">
            <Button href={resolve("/profile")} class="w-full">
              Go to my account
            </Button>
          </Card.Footer>
        </div>
      {/if}
    </Card.Root>
  {/if}
</div>
