<script lang="ts">
import ChevronLeft from "@lucide/svelte/icons/chevron-left";
import { toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Input } from "@nota/ui/shadcn/input/index.js";
import { Label } from "@nota/ui/shadcn/label/index.js";
import { cn } from "@nota/ui/utils";
import { Turnstile } from "svelte-turnstile";
import { AppLogo, TiltCard } from "#components/custom/index.js";
import Particles from "#components/custom/landing/particles.svelte";
import { authClient } from "#lib/auth-client.js";
import { PUBLIC_NOTA_URL, PUBLIC_TURNSILE_SITE_KEY } from "$app/env/public";
import { resolve } from "$app/paths";
import { page } from "$app/state";

let email = $state("");
let password = $state("");
let captchaToken = $state("");
let loading = $state(false);
let isSuccess = $state(false);

const token = $derived(page.url.searchParams.get("token"));
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const handleSubmit = async (e?: SubmitEvent) => {
	e?.preventDefault();
	if (loading) return;

	if (!token) {
		const trimmedEmail = email.trim();
		if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
			toast.error("Please enter a valid email address.");
			return;
		}
	} else {
		if (!password || password.length < 8) {
			toast.error("Password must be at least 8 characters long.");
			return;
		}
	}

	if (!captchaToken) {
		toast.error("Please complete the captcha.");
		return;
	}

	loading = true;
	try {
		if (token) {
			// Actually resetting the password
			const { error } = await authClient.resetPassword({
				newPassword: password,
				token,
				fetchOptions: {
					headers: {
						"x-captcha-response": captchaToken,
					},
				},
			});

			if (error) {
				toast.error(error.message || "Failed to reset password.");
			} else {
				toast.success("Password reset successfully. You can now sign in.");
				window.location.href = resolve("/signin");
			}
		} else {
			// Requesting a reset link
			const { error } = await authClient.requestPasswordReset({
				email: email.trim().toLowerCase(),
				redirectTo: `${PUBLIC_NOTA_URL || window.location.origin}/password-reset`,
				fetchOptions: {
					headers: {
						"x-captcha-response": captchaToken,
					},
				},
			});

			if (error) {
				console.error("Failed to send reset link:", error);
				toast.error(error.message || "Failed to send reset link.");
			} else {
				isSuccess = true;
				toast.success("Password reset link sent to your email.");
			}
		}
	} catch (err: any) {
		console.error("Password reset error:", err);
		toast.error(err?.message || "An unexpected error occurred.");
	} finally {
		loading = false;
	}
};
</script>

<svelte:head>
  <title>Reset Password | Nota</title>
  <meta name="description" content="Reset your Nota account password." />
</svelte:head>

<Particles class="fixed top-0 size-full" />

<div class={cn("relative w-full md:h-screen md:overflow-hidden")}>
  <Particles class="absolute inset-0" ease={20} quantity={120} />
  <div
    class="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-8 py-10"
  >
    <Button class="absolute top-4 left-4" href={resolve(token ? "/signin" : "/")} variant="ghost">
      <ChevronLeft data-icon="inline-start" />
      {token ? "Back to Sign In" : "Home"}
    </Button>
    <TiltCard
      scale={1.0125}
      tiltLimit={5}
      spotlight={false}
      class="bg-card/50 mx-auto w-full max-w-md space-y-4 rounded-xl p-8"
    >
      <AppLogo />
      <div class="flex flex-col space-y-1">
        <h1 class="text-2xl font-bold tracking-wide">{token ? "Set New Password" : "Reset Password"}</h1>
        <p class="text-base text-muted-foreground">
          {token ? "Enter your new password below." : "Enter your email to receive a password reset link."}
        </p>
      </div>

      {#if isSuccess && !token}
        <div class="space-y-4">
          <div class="text-sm text-center bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md">
            Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
          </div>
          <Button class="w-full" variant="outline" href={resolve("/signin")}>
            Back to Sign In
          </Button>
        </div>
      {:else}
        <div class="space-y-4">
          <form onsubmit={handleSubmit} class="space-y-4">
            {#if token}
              <div class="space-y-2">
                <Label for="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  minlength={8}
                  maxlength={64}
                  placeholder="********"
                  bind:value={password}
                  required
                />
              </div>
            {:else}
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
            {/if}

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
              disabled={loading || !captchaToken}
            >
              {#if loading}
                <BarSpinner size={16} />
              {:else}
                {token ? "Reset Password" : "Send Reset Link"}
              {/if}
            </Button>
          </form>

          {#if !token}
            <div class="mt-4 text-center text-sm">
              Remember your password?
              <a href={resolve("/signin")} class="underline underline-offset-4">Sign in</a>
            </div>
          {/if}
        </div>
      {/if}
    </TiltCard>
  </div>
</div>
