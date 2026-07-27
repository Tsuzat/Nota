<script lang="ts">
import { Button } from '@lib/components/ui/button';
import * as Card from '@lib/components/ui/card';
import { onMount } from 'svelte';
import { cubicOut, linear } from 'svelte/easing';
import { draw, fade, slide } from 'svelte/transition';
import { resolve } from '$app/paths';
import Applogo from '$lib/components/custom/applogo.svelte';
import Particles from '$lib/components/custom/landing/particles.svelte';

let isLoading = $state(true);
let showSuccessAnimation = $state(false);
let showDetails = $state(false);

onMount(async () => {
  // Just a nice loading effect before showing success
  await new Promise((r) => setTimeout(r, 800));
  isLoading = false;
  showSuccessAnimation = true;
  // Trigger details fade in after checkmark draws
  setTimeout(() => {
    showDetails = true;
  }, 500);
});
</script>

<Particles class="fixed top-0 left-0 -z-10 h-screen w-screen bg-transparent!" />
<div
  class="relative w-full min-h-screen flex flex-col items-center justify-center p-4"
>
  <div class="mb-6">
    <Applogo showLogo={true} />
  </div>

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

    {#if showDetails}
      <div in:slide={{ duration: 500, easing: linear }}>
        <Card.Content class="text-center text-sm px-8 pb-4">
          <p class="text-muted-foreground">
            A receipt and your subscription details have been sent to your
            email.
          </p>
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
</div>
