<script lang="ts">
import ChevronLeft from "@lucide/svelte/icons/chevron-left";
import { toast } from "@nota/ui";
import { BarSpinner, Github, Google } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { cn } from "@nota/ui/utils";
import { AppLogo, TiltCard } from "#components/custom/index.js";
import Particles from "#components/custom/landing/particles.svelte";
import { authClient } from "#lib/auth-client.js";
import { resolve } from "$app/paths";
import { page } from "$app/state";

const sessionQuery = authClient.useSession();

const callbackURL = $derived(
	page.url.searchParams.get("redirectTo") || page.url.origin,
);

$effect(() => {
	if ($sessionQuery.data?.user) {
		window.location.href = callbackURL;
	}
});

let loadingProvider = $state<"google" | "github" | null>(null);

$effect(() => {
	const error =
		page.url.searchParams.get("error_description") ||
		page.url.searchParams.get("error");
	if (error) {
		const message =
			error === "access_denied" ? "Sign-in request was cancelled." : error;
		toast.error(message);
	}
});

const handleSignIn = async (provider: "google" | "github") => {
	if (loadingProvider) return;

	loadingProvider = provider;
	try {
		const { error } = await authClient.signIn.social({
			provider,
			callbackURL,
			fetchOptions: {
				onError: (ctx) => {
					const msg =
						ctx.error?.message ||
						`Failed to sign in with ${provider === "google" ? "Google" : "GitHub"}. Please try again.`;
					toast.error(msg);
				},
			},
		});

		if (error) {
			toast.error(
				error.message ||
					`Failed to sign in with ${provider === "google" ? "Google" : "GitHub"}. Please try again.`,
			);
		}
	} catch (err: any) {
		console.error(`Sign in with ${provider} failed:`, err);
		toast.error(
			err?.message ||
				`An unexpected error occurred while signing in with ${provider === "google" ? "Google" : "GitHub"}.`,
		);
	} finally {
		loadingProvider = null;
	}
};
</script>

<svelte:head>
  <title>Sign In | Nota</title>
  <meta name="description" content="Sign in or create your Nota account." />
</svelte:head>

<Particles class="fixed top-0 size-full" />

<div class={cn("relative w-full md:h-screen md:overflow-hidden")}>
  <Particles class="absolute inset-0" ease={20} quantity={120} />
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
      class="bg-card/50 mx-auto w-full max-w-sm space-y-4 rounded-xl p-8"
    >
      <AppLogo />
      <div class="flex flex-col space-y-1">
        <h1 class="text-2xl font-bold tracking-wide">Sign In or Join Now!</h1>
        <p class="text-base text-muted-foreground">
          login or create your nota account.
        </p>
      </div>
      <div class="space-y-2">
        <Button
          class="w-full"
          disabled={loadingProvider !== null}
          onclick={() => handleSignIn("google")}
        >
          {#if loadingProvider === "google"}
            <BarSpinner size={16} />
          {:else}
            <Google />
          {/if}
          Continue with Google
        </Button>
        <Button
          class="w-full"
          disabled={loadingProvider !== null}
          onclick={() => handleSignIn("github")}
        >
          {#if loadingProvider === "github"}
            <BarSpinner size={16} />
          {:else}
            <Github  /> 
          {/if}
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
