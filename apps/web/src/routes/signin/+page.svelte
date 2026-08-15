<script lang="ts">
import ChevronLeft from "@lucide/svelte/icons/chevron-left";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { cn } from "@nota/ui/utils";
import { AppLogo, TiltCard } from "#components/custom/index.ts";
import { authClient } from "#lib/auth-client.ts";
import { resolve } from "$app/paths";

const handleSignIn = async (provider: "google" | "github") => {
	await authClient.signIn.social({
		provider,
		callbackURL: "/",
	});
};
</script>

<svelte:head>
  <title>Sign In | Nota</title>
  <meta name="description" content="Sign in or create your Nota account." />
</svelte:head>

<div class={cn("relative w-full md:h-screen md:overflow-hidden")}>
  <!-- <Particles class="absolute inset-0" ease={20} quantity={120} /> -->
  <div
    class="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-8"
  >
    <Button class="absolute top-4 left-4" href={resolve("/")} variant="ghost">
      <ChevronLeft data-icon="inline-start" />
      Home
    </Button>
    <TiltCard
      scale={1.0125}
      tiltLimit={10}
      class="bg-card mx-auto w-full max-w-sm space-y-4 rounded-xl p-4"
    >
      <AppLogo />
      <div class="flex flex-col space-y-1">
        <h1 class="text-2xl font-bold tracking-wide">Sign In or Join Now!</h1>
        <p class="text-base text-muted-foreground">
          login or create your nota account.
        </p>
      </div>
      <div class="space-y-2">
        <Button class="w-full" onclick={() => handleSignIn("google")}>
          <img class="size-4" src="https://svgl.app/library/google.svg" alt="Google" />
          Continue with Google
        </Button>
        <Button class="w-full" onclick={() => handleSignIn("github")}>
          <img
            class="hidden dark:block size-4"
            src="https://svgl.app/library/github_light.svg"
            alt="Github"
          />
          <img
            class="block dark:hidden size-4"
            src="https://svgl.app/library/github_dark.svg"
            alt="Github"
          />
          Continue with GitHub
        </Button>
      </div>
      <span class="mt-8 text-sm text-muted-foreground">
        By clicking continue, you agree to our
        <Button class="underline" variant="link" href={resolve("/(tnc)/terms")}
          >Terms of Service</Button
        >
        and
        <Button class="underline" variant="link" href={resolve("/(tnc)/privacy")}
          >Privacy Policy</Button
        >.
      </span>
    </TiltCard>
  </div>
</div>
