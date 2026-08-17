<script lang="ts">
import ArrowRight from "@lucide/svelte/icons/arrow-right";
import MonitorSmartphone from "@lucide/svelte/icons/monitor-smartphone";
import ShieldCheck from "@lucide/svelte/icons/shield-check";
import { toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { Input } from "@nota/ui/shadcn/input/index.js";
import { cn } from "@nota/ui/utils";
import { authClient } from "#lib/auth-client.ts";
import { goto } from "$app/navigation";
import { page } from "$app/state";

const sessionQuery = authClient.useSession();

let userCode = $state(page.url.searchParams.get("user_code") || "");
let isVerifying = $state(false);
let error = $state<string | null>(null);

// Auto-verify if user_code is in URL and user is signed in
$effect(() => {
	const codeFromUrl = page.url.searchParams.get("user_code");
	if (codeFromUrl && $sessionQuery.data?.user) {
		userCode = codeFromUrl;
		handleSubmit();
	}
});

async function handleSubmit() {
	if (!userCode.trim()) {
		error = "Please enter a device code.";
		return;
	}

	error = null;
	const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();

	// If not signed in, redirect to signin with return URL
	if (!$sessionQuery.data?.user) {
		const returnUrl = `/device?user_code=${encodeURIComponent(formattedCode)}`;
		goto(`/signin?redirectTo=${encodeURIComponent(returnUrl)}`);
		return;
	}

	isVerifying = true;
	try {
		// Claim the device code for this session
		const response = await authClient.device({
			query: { user_code: formattedCode },
		});

		if (response.data) {
			goto(`/device/approve?user_code=${encodeURIComponent(formattedCode)}`);
		} else {
			error = "Invalid or expired code. Please check and try again.";
		}
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Invalid or expired code.";
		error = message;
		toast.error(message);
	} finally {
		isVerifying = false;
	}
}
</script>

<svelte:head>
	<title>Device Authorization | Nota</title>
	<meta
		name="description"
		content="Authorize a device to access your Nota account."
	/>
</svelte:head>

<div class={cn("relative w-full md:h-screen md:overflow-hidden")}>
	<div class="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-8">
		
		<div class="bg-card/60 border border-border/50 mx-auto w-full max-w-md space-y-8 rounded-2xl p-10 shadow-2xl backdrop-blur-xl transition-all duration-500">
			
			<div class="flex flex-col items-center space-y-4 text-center">
				<div class="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
					<MonitorSmartphone class="size-8" />
				</div>
				<div class="space-y-1.5">
					<h1 class="text-2xl font-bold tracking-tight">Authorize Device</h1>
					<p class="text-sm text-muted-foreground px-4">
						Enter the pairing code shown on your desktop or secondary device to grant access.
					</p>
				</div>
			</div>

			<form
				class="space-y-6"
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="flex flex-col gap-3">
					<label for="user-code" class="text-sm font-semibold tracking-wide text-foreground/90 ml-1">Device Pairing Code</label>
					<div class="relative">
						<Input
							id="user-code"
							type="text"
							bind:value={userCode}
							placeholder="ABCD-1234"
							class="h-14 bg-background/50 text-center font-mono text-2xl font-bold tracking-widest placeholder:text-muted-foreground/30 focus-visible:ring-primary/50"
							maxlength={9}
							disabled={isVerifying}
						/>
					</div>
					{#if error}
						<p class="text-sm text-destructive font-medium ml-1 flex items-center gap-1.5">
							<span class="inline-block size-1.5 rounded-full bg-destructive"></span>
							{error}
						</p>
					{/if}
				</div>

				<Button class="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all group" type="submit" disabled={isVerifying || !userCode.trim()}>
					{#if isVerifying}
						<BarSpinner size={18} class="mr-2" />
						Verifying Code…
					{:else}
						<ShieldCheck class="mr-2 size-5 text-primary-foreground/80" />
						Verify & Continue
						<ArrowRight class="ml-2 size-4 opacity-70 transition-transform group-hover:translate-x-1" />
					{/if}
				</Button>
			</form>

			{#if !$sessionQuery.data?.user && !$sessionQuery.isPending}
				<div class="rounded-lg bg-muted/50 p-4 border border-border/40">
					<p class="text-xs text-center text-muted-foreground">
						You are currently signed out. You will be asked to <strong class="text-foreground">sign in</strong> first.
					</p>
				</div>
			{/if}
			
		</div>
	</div>
</div>
