<script lang="ts">
import { Button } from '@lib/components/ui/button';
import { Github, Google, icons } from '@lib/icons';
import { cn } from '@lib/utils';
import { getAuthContext } from '@nota/client';
import { resolve } from '$app/paths';
import Applogo from '$lib/components/custom/applogo.svelte';
import Particles from '$lib/components/custom/landing/particles.svelte';
import Tiltcard from '$lib/components/custom/landing/utils/tiltcard.svelte';

const authClient = getAuthContext();
</script>

<svelte:head>
  <title>Sign In | Nota</title>
  <meta name="description" content="Sign in or create your Nota account." />
</svelte:head>

<div class={cn("relative w-full md:h-screen md:overflow-hidden")}>
  <Particles class="absolute inset-0" ease={20} quantity={120} />
  <div
    class="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-8"
  >
    <Button class="absolute top-4 left-4" href={resolve("/")} variant="ghost">
      <icons.ChevronLeft data-icon="inline-start" />
      Home
    </Button>
    <Tiltcard
      scale={1.0125}
      tiltLimit={10}
      class="dark:bg-card/75 bg-card mx-auto w-full max-w-sm space-y-4 rounded-xl p-4"
    >
      <Applogo />
      <div class="flex flex-col space-y-1">
        <h1 class="text-2xl font-bold tracking-wide">Sign In or Join Now!</h1>
        <p class="text-base text-muted-foreground">
          login or create your nota account.
        </p>
      </div>
      <div class="space-y-2">
        <Button
          class="w-full"
          onclick={() => authClient.signInWithOAuth("google")}
        >
          <Google />
          Continue with Google
        </Button>
        <Button
          class="w-full"
          onclick={() => authClient.signInWithOAuth("github")}
        >
          <Github />
          Continue with GitHub
        </Button>
      </div>
      <span class="mt-8 text-sm text-muted-foreground">
        By clicking continue, you agree to our
        <Button class="underline" variant="link" href={resolve("/terms")}
          >Terms of Service</Button
        >
        and
        <Button class="underline" variant="link" href={resolve("/privacy")}
          >Privacy Policy</Button
        >.
      </span>
    </Tiltcard>
  </div>
</div>
