<script lang="ts">
import ChevronLeft from "@lucide/svelte/icons/chevron-left";
import { toast } from "@nota/ui";
import { BarSpinner, Github, Google } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Input } from "@nota/ui/shadcn/input/index.js";
import { Label } from "@nota/ui/shadcn/label/index.js";
import { Separator } from "@nota/ui/shadcn/separator/index.js";
import { cn } from "@nota/ui/utils";
import { Turnstile } from "svelte-turnstile";
import { AppLogo, TiltCard } from "#components/custom/index.js";
import Particles from "#components/custom/landing/particles.svelte";
import { authClient } from "#lib/auth-client.js";
import {
	PUBLIC_NOTA_APP_URL,
	PUBLIC_NOTA_URL,
	PUBLIC_TURNSILE_SITE_KEY,
} from "$app/env/public";
import { resolve } from "$app/paths";
import { page } from "$app/state";

const sessionQuery = authClient.useSession();

const callbackURL = $derived.by(() => {
	const callBack = page.url.searchParams.get("redirectTo");
	const baseUrl = (PUBLIC_NOTA_URL || page.url.origin).replace(/\/+$/, "");
	const appUrl = (PUBLIC_NOTA_APP_URL || "").replace(/\/+$/, "");

	if (!callBack) {
		return baseUrl;
	}

	if (callBack.startsWith("/")) {
		return `${baseUrl}${callBack}`;
	}

	if (
		appUrl &&
		(callBack === appUrl ||
			callBack.startsWith(`${appUrl}/`) ||
			callBack.startsWith(`${appUrl}?`))
	) {
		return callBack;
	}

	if (
		baseUrl &&
		(callBack === baseUrl ||
			callBack.startsWith(`${baseUrl}/`) ||
			callBack.startsWith(`${baseUrl}?`))
	) {
		return callBack;
	}

	return baseUrl;
});

$effect(() => {
	if ($sessionQuery.data?.user) {
		window.location.href = callbackURL;
	}
});

let loadingProvider = $state<"google" | "github" | "email" | null>(null);
let email = $state("");
let password = $state("");
let name = $state("");
let captchaToken = $state("");

const handleSignUp = async (provider: "google" | "github" | "email") => {
	if (loadingProvider) return;

	loadingProvider = provider;
	try {
		if (provider === "email") {
			if (!captchaToken) {
				toast.error("Please complete the captcha.");
				loadingProvider = null;
				return;
			}
			const { error } = await authClient.signUp.email({
				email,
				password,
				name,
				callbackURL: PUBLIC_NOTA_URL,
				fetchOptions: {
					headers: {
						"x-captcha-response": captchaToken,
					},
				},
			});

			if (error) {
				toast.error(error.message || "Failed to sign up. Please try again.");
			} else {
				toast.success(
					"Account created successfully. Please check your email to verify your account.",
				);
			}
			return;
		}

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
		console.error(`Sign up with ${provider} failed:`, err);
		toast.error(
			err?.message ||
				`An unexpected error occurred while signing up with ${provider === "google" ? "Google" : "GitHub"}.`,
		);
	} finally {
		loadingProvider = null;
	}
};
</script>

<svelte:head>
  <title>Sign Up | Nota</title>
  <meta name="description" content="Create your Nota account." />
</svelte:head>

<Particles class="fixed top-0 size-full" />

<div class={cn("relative w-full md:h-screen md:overflow-hidden")}>
  <Particles class="absolute inset-0" ease={20} quantity={120} />
  <div
    class="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-8 py-10"
  >
    <Button class="absolute top-4 left-4" href={resolve("/")} variant="ghost">
      <ChevronLeft data-icon="inline-start" />
      Home
    </Button>
    <TiltCard
      scale={1.0125}
      tiltLimit={5}
      spotlight={false}
      class="bg-card/50 mx-auto w-full max-w-md space-y-4 rounded-xl p-8"
    >
      <AppLogo />
      <div class="flex flex-col space-y-1">
        <h1 class="text-2xl font-bold tracking-wide">Create an Account</h1>
        <p class="text-base text-muted-foreground">
          Sign up to get started with Nota.
        </p>
      </div>
      <div class="space-y-4">
        <form onsubmit={() => handleSignUp("email")} class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              bind:value={name}
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              bind:value={email}
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              minlength={8}
              maxlength={64}
              placeholder="********"
              id="password"
              type="password"
              bind:value={password}
              required
            />
          </div>
          <div class="flex justify-center">
            <Turnstile
              siteKey={PUBLIC_TURNSILE_SITE_KEY}
              on:turnstile-callback={(e) => {
                captchaToken = e.detail.token;
              }}
            />
          </div>
          <Button
            class="w-full"
            type="submit"
            disabled={loadingProvider !== null || !captchaToken}
            onclick={() => {}}
          >
            {#if loadingProvider === "email"}
              <BarSpinner size={16} />
            {:else}
              Sign Up
            {/if}
          </Button>
        </form>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <Separator class="w-full" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card/50 px-2 text-muted-foreground"
              >Or continue with</span
            >
          </div>
        </div>

        <Button
          class="w-full"
          variant="outline"
          disabled={loadingProvider !== null}
          onclick={() => handleSignUp("google")}
        >
          {#if loadingProvider === "google"}
            <BarSpinner size={16} />
          {:else}
            <Google />
          {/if}
          Google
        </Button>
        <Button
          class="w-full"
          variant="outline"
          disabled={loadingProvider !== null}
          onclick={() => handleSignUp("github")}
        >
          {#if loadingProvider === "github"}
            <BarSpinner size={16} />
          {:else}
            <Github />
          {/if}
          GitHub
        </Button>
      </div>
      <div class="mt-4 text-center text-sm">
        Already have an account?
        <a href="/signin" class="underline underline-offset-4">Sign in</a>
      </div>
      <span class="mt-8 block text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our
        <Button
          class="underline px-1 py-0 h-auto"
          variant="link"
          href={resolve("/(tnc)/terms")}>Terms of Service</Button
        >
        and
        <Button
          class="underline px-1 py-0 h-auto"
          variant="link"
          href={resolve("/(tnc)/privacy")}>Privacy Policy</Button
        >.
      </span>
    </TiltCard>
  </div>
</div>
