<script lang="ts">
import ArrowLeft from "@lucide/svelte/icons/arrow-left";
import ChevronLeft from "@lucide/svelte/icons/chevron-left";
import Fingerprint from "@lucide/svelte/icons/fingerprint";
import Mail from "@lucide/svelte/icons/mail";
import { toast } from "@nota/ui";
import { BarSpinner, Github, Google } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Checkbox } from "@nota/ui/shadcn/checkbox/index.js";
import { Input } from "@nota/ui/shadcn/input/index.js";
import { Label } from "@nota/ui/shadcn/label/index.js";
import { cn } from "@nota/ui/utils";
import { onMount } from "svelte";
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

	// If it's a path like "/device?user_code=abcf", prefix with PUBLIC_NOTA_URL
	if (callBack.startsWith("/")) {
		return `${baseUrl}${callBack}`;
	}

	// If it's a URL matching PUBLIC_NOTA_APP_URL
	if (
		appUrl &&
		(callBack === appUrl ||
			callBack.startsWith(`${appUrl}/`) ||
			callBack.startsWith(`${appUrl}?`))
	) {
		return callBack;
	}

	// If it's already a full URL matching PUBLIC_NOTA_URL
	if (
		baseUrl &&
		(callBack === baseUrl ||
			callBack.startsWith(`${baseUrl}/`) ||
			callBack.startsWith(`${baseUrl}?`))
	) {
		return callBack;
	}

	// Default to PUBLIC_NOTA_URL in all other cases
	return baseUrl;
});

$effect(() => {
	if ($sessionQuery.data?.user) {
		window.location.href = callbackURL;
	}
});

let loadingProvider = $state<"google" | "github" | "email" | null>(null);
let passkeyLoading = $state(false);
let lastLoginMethod = $state<string | null>(null);
let view = $state<"options" | "email">("options");
let email = $state("");
let password = $state("");
let rememberMe = $state(false);
let captchaToken = $state("");

let optionsHeight = $state(0);
let emailHeight = $state(0);
const currentHeight = $derived.by(() => {
	if (view === "email") {
		return emailHeight > 0 ? `${emailHeight}px` : "auto";
	}
	return optionsHeight > 0 ? `${optionsHeight}px` : "auto";
});

onMount(async () => {
	// Retrieve last used login method
	if (typeof authClient.getLastUsedLoginMethod === "function") {
		const method = authClient.getLastUsedLoginMethod();
		if (method) {
			lastLoginMethod = method;
		}
	}

	// Conditional UI (WebAuthn / Passkey autofill)
	if (
		typeof window !== "undefined" &&
		window.PublicKeyCredential &&
		typeof PublicKeyCredential.isConditionalMediationAvailable === "function"
	) {
		try {
			const isAvailable =
				await PublicKeyCredential.isConditionalMediationAvailable();
			if (isAvailable) {
				void authClient.signIn.passkey({
					autoFill: true,
					fetchOptions: {
						onSuccess: () => {
							window.location.href = callbackURL;
						},
						onError: (ctx) => {
							// Passive conditional UI errors or aborts are silent
							console.debug("Passkey autofill:", ctx.error?.message);
						},
					},
				});
			}
		} catch (err) {
			console.debug("Conditional mediation check failed:", err);
		}
	}
});

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

const handlePasskeySignIn = async () => {
	if (loadingProvider || passkeyLoading) return;
	passkeyLoading = true;
	try {
		const res = await authClient.signIn.passkey({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = callbackURL;
				},
				onError: (ctx) => {
					const errName = ctx.error?.name || "";
					const errMsg = ctx.error?.message || "";
					if (
						errName === "NotAllowedError" ||
						errName === "AbortError" ||
						errMsg.toLowerCase().includes("cancel") ||
						errMsg.toLowerCase().includes("abort")
					) {
						return;
					}
					toast.error(
						errMsg || "Failed to sign in with Passkey. Please try again.",
					);
				},
			},
		});

		if (res?.error) {
			const errMsg = res.error.message || "";
			if (
				!errMsg.toLowerCase().includes("cancel") &&
				!errMsg.toLowerCase().includes("abort")
			) {
				toast.error(
					errMsg || "Failed to sign in with Passkey. Please try again.",
				);
			}
		} else if (res?.data) {
			window.location.href = callbackURL;
		}
	} catch (err: any) {
		const errName = err?.name || "";
		const errMsg = err?.message || "";
		if (
			errName !== "NotAllowedError" &&
			errName !== "AbortError" &&
			!errMsg.toLowerCase().includes("cancel") &&
			!errMsg.toLowerCase().includes("abort")
		) {
			console.error("Sign in with Passkey failed:", err);
			toast.error(
				errMsg || "An unexpected error occurred while signing in with Passkey.",
			);
		}
	} finally {
		passkeyLoading = false;
	}
};

const handleSignIn = async (provider: "google" | "github" | "email") => {
	if (loadingProvider) return;

	loadingProvider = provider;
	try {
		if (provider === "email") {
			if (!captchaToken) {
				toast.error("Please complete the captcha.");
				loadingProvider = null;
				return;
			}
			const { error } = await authClient.signIn.email({
				email,
				password,
				rememberMe,
				fetchOptions: {
					headers: {
						"x-captcha-response": captchaToken,
					},
					onError: (ctx) => {
						const msg =
							ctx.error?.message || "Failed to sign in. Please try again.";
						toast.error(msg);
					},
				},
			});

			if (error) {
				toast.error(error.message || "Failed to sign in. Please try again.");
			} else {
				window.location.href = callbackURL;
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
      tiltLimit={5}
      spotlight={false}
      class="bg-card/50 mx-auto w-full max-w-md space-y-5 rounded-xl p-8 overflow-hidden"
    >
      <!-- Header with fluid back button, logo glide, and cross-sliding titles -->
      <div class="space-y-4">
        <div class="relative flex items-center min-h-8">
          <div
            class={cn(
              "absolute left-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              view === "email"
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-3 pointer-events-none"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              class="-ml-2 h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
              onclick={() => {
                view = "options";
              }}
              aria-label="Back to sign in options"
            >
              <ArrowLeft class="size-4" />
            </Button>
          </div>

          <div
            class={cn(
              "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              view === "email" ? "translate-x-7" : "translate-x-0"
            )}
          >
            <AppLogo />
          </div>
        </div>

        <div class="relative overflow-hidden min-h-[3.75rem]">
          <div
            class={cn(
              "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              view === "options"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-3 absolute inset-0 pointer-events-none"
            )}
          >
            <h1 class="text-2xl font-bold tracking-wide">Sign In to your Nota account</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Choose your preferred sign-in method.
            </p>
          </div>

          <div
            class={cn(
              "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              view === "email"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3 absolute inset-0 pointer-events-none"
            )}
          >
            <h1 class="text-2xl font-bold tracking-wide">Sign in with Email</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Enter your credentials to access your account.
            </p>
          </div>
        </div>
      </div>

      <!-- Fluid Horizontal Sliding Panels with Animated Dynamic Height -->
      <div
        class="relative overflow-hidden w-full transition-[height] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style:height={currentHeight}
      >
        <div
          class={cn(
            "flex items-start w-[200%] transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]",
            view === "email" ? "-translate-x-1/2" : "translate-x-0"
          )}
        >
          <!-- 1. Options Panel -->
          <div
            bind:clientHeight={optionsHeight}
            class={cn(
              "w-1/2 shrink-0 space-y-3 pr-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              view === "options"
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            )}
          >
            <!-- Google Option -->
            <Button
              class={cn(
                "w-full relative justify-center",
                lastLoginMethod === "google" && "border-primary/50 bg-primary/5"
              )}
              variant="outline"
              disabled={loadingProvider !== null}
              onclick={() => handleSignIn("google")}
            >
              {#if loadingProvider === "google"}
                <BarSpinner size={16} />
              {:else}
                <Google />
              {/if}
              <span>Sign In With Google</span>
              {#if lastLoginMethod === "google"}
                <Badge variant="secondary" class="absolute right-2.5 text-[10px] h-4 px-1.5 font-normal">
                  Last used
                </Badge>
              {/if}
            </Button>

            <!-- GitHub Option -->
            <Button
              class={cn(
                "w-full relative justify-center",
                lastLoginMethod === "github" && "border-primary/50 bg-primary/5"
              )}
              variant="outline"
              disabled={loadingProvider !== null}
              onclick={() => handleSignIn("github")}
            >
              {#if loadingProvider === "github"}
                <BarSpinner size={16} />
              {:else}
                <Github />
              {/if}
              <span>Sign In With GitHub</span>
              {#if lastLoginMethod === "github"}
                <Badge variant="secondary" class="absolute right-2.5 text-[10px] h-4 px-1.5 font-normal">
                  Last used
                </Badge>
              {/if}
            </Button>

            <!-- Passkey Option -->
            <Button
              class={cn(
                "w-full relative justify-center",
                lastLoginMethod === "passkey" && "border-primary/50 bg-primary/5"
              )}
              variant="outline"
              disabled={loadingProvider !== null || passkeyLoading}
              onclick={() => handlePasskeySignIn()}
            >
              {#if passkeyLoading}
                <BarSpinner size={16} />
              {:else}
                <Fingerprint class="size-4" />
              {/if}
              <span>Sign In With Passkey</span>
              {#if lastLoginMethod === "passkey"}
                <Badge variant="secondary" class="absolute right-2.5 text-[10px] h-4 px-1.5 font-normal">
                  Last used
                </Badge>
              {/if}
            </Button>

            <!-- Email Option -->
            <Button
              class={cn(
                "w-full relative justify-center",
                lastLoginMethod === "email" && "border-primary/50 bg-primary/5"
              )}
              variant="outline"
              disabled={loadingProvider !== null}
              onclick={() => {
                view = "email";
              }}
            >
              <Mail class="size-4" />
              <span>Sign In With Email</span>
              {#if lastLoginMethod === "email"}
                <Badge variant="secondary" class="text-[10px] h-4 px-1.5 font-normal">
                  Last used
                </Badge>
              {/if}
            </Button>
          </div>

          <!-- 2. Email Form Panel -->
          <div
            bind:clientHeight={emailHeight}
            class={cn(
              "w-1/2 shrink-0 space-y-4 pl-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              view === "email"
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            )}
          >
            <form
              onsubmit={(e) => {
                e.preventDefault();
                handleSignIn("email");
              }}
              class="space-y-4"
            >
              <div class="space-y-1.5">
                <Label for="email" class="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autocomplete="username webauthn"
                  bind:value={email}
                  required
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <Label for="password" class="text-xs">Password</Label>
                  <a
                    href="/password-reset"
                    class="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  minlength={8}
                  maxlength={64}
                  placeholder="••••••••"
                  autocomplete="current-password webauthn"
                  bind:value={password}
                  required
                />
              </div>

              <div class="flex items-center space-x-2 pt-0.5">
                <Checkbox id="remember-me" bind:checked={rememberMe} />
                <Label
                  for="remember-me"
                  class="text-xs font-normal text-muted-foreground cursor-pointer select-none"
                >
                  Remember me
                </Label>
              </div>

              <div class="flex justify-center pt-1">
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
              >
                {#if loadingProvider === "email"}
                  <BarSpinner size={16} />
                {:else}
                  Sign In
                {/if}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div class="text-center text-sm">
        Don't have an account?
        <a href="/signup" class="underline underline-offset-4 hover:text-primary">Sign up</a>
      </div>

      <p class="text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our
        <Button class="h-auto p-0 text-xs underline" variant="link" href={resolve("/(tnc)/terms")}>
          Terms of Service
        </Button>
        and
        <Button class="h-auto p-0 text-xs underline" variant="link" href={resolve("/(tnc)/privacy")}>
          Privacy Policy
        </Button>.
      </p>
    </TiltCard>
  </div>
</div>

