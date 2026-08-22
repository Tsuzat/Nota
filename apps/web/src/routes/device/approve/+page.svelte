<script lang="ts">
import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
import ShieldQuestion from "@lucide/svelte/icons/shield-question";
import XCircle from "@lucide/svelte/icons/x-circle";
import { toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { cn } from "@nota/ui/utils";
import Particles from "#components/custom/landing/particles.svelte";
import { authClient } from "#lib/auth-client.ts";
import { goto } from "$app/navigation";
import { page } from "$app/state";

const sessionQuery = authClient.useSession();

const userCode = $derived(page.url.searchParams.get("user_code") || "");
let isProcessing = $state(false);
let result = $state<"approved" | "denied" | null>(null);

// Redirect to sign in if not authenticated
$effect(() => {
	if (!$sessionQuery.isPending && !$sessionQuery.data?.user) {
		const returnUrl = `/device?user_code=${encodeURIComponent(userCode)}`;
		setTimeout(() => {
			goto(`/signin?redirectTo=${encodeURIComponent(returnUrl)}`);
		}, 0);
	}
});

async function handleApprove() {
	isProcessing = true;
	try {
		await authClient.device.approve({ userCode });
		result = "approved";
		toast.success("Device authorized successfully!");
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Failed to approve device.";
		toast.error(message);
	} finally {
		isProcessing = false;
	}
}

async function handleDeny() {
	isProcessing = true;
	try {
		await authClient.device.deny({ userCode });
		result = "denied";
		toast.info("Device authorization denied.");
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Failed to deny device.";
		toast.error(message);
	} finally {
		isProcessing = false;
	}
}
</script>


<div class={cn("relative w-full md:h-screen md:overflow-hidden")}>
	<Particles class="absolute inset-0" ease={20} quantity={120} />
	<div class="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-8">
		<div class="bg-card/60 border border-border/50 mx-auto w-full max-w-md space-y-8 rounded-2xl p-10 shadow-2xl backdrop-blur-xl transition-all duration-500">
			
			{#if result === "approved"}
				<div class="space-y-5 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
					<div class="flex size-20 items-center justify-center rounded-full bg-green-500/20 text-green-500 ring-8 ring-green-500/10">
						<CheckCircle2 class="size-10" />
					</div>
					<div class="space-y-2">
						<h1 class="text-2xl font-bold tracking-tight text-green-600 dark:text-green-500">
							Device Authorized
						</h1>
						<p class="text-sm text-muted-foreground px-2">
							Your device has been authorized successfully. You can close this tab
							and return to the Nota app.
						</p>
					</div>
				</div>

			{:else if result === "denied"}
				<div class="space-y-5 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
					<div class="flex size-20 items-center justify-center rounded-full bg-destructive/20 text-destructive ring-8 ring-destructive/10">
						<XCircle class="size-10" />
					</div>
					<div class="space-y-2">
						<h1 class="text-2xl font-bold tracking-tight text-destructive">
							Authorization Denied
						</h1>
						<p class="text-sm text-muted-foreground px-2">
							The device authorization request was denied. You can close this tab safely.
						</p>
					</div>
				</div>

			{:else}
				<div class="flex flex-col items-center space-y-4 text-center">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
						<ShieldQuestion class="size-8" />
					</div>
					<div class="space-y-1.5">
						<h1 class="text-2xl font-bold tracking-tight">Approve Access Request</h1>
						<p class="text-sm text-muted-foreground">
							A device is requesting access to your Nota account.
						</p>
					</div>
				</div>

				{#if userCode}
					<div class="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-5 text-center">
						<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Verification Code</p>
						<p class="font-mono text-3xl font-bold tracking-[0.2em] text-foreground">
							{userCode.slice(0, 4)}<span class="text-muted-foreground/40 mx-1">-</span>{userCode.slice(4)}
						</p>
					</div>
				{/if}

				{#if $sessionQuery.data?.user}
					<div class="flex items-center justify-center gap-2 rounded-lg bg-secondary/50 py-3 px-4 border border-secondary">
						<div class="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
						<p class="text-sm text-muted-foreground">
							Signed in as <span class="font-medium text-foreground">{$sessionQuery.data.user.email}</span>
						</p>
					</div>
				{/if}

				<div class="flex flex-col-reverse sm:flex-row gap-3 pt-2">
					<Button
						class="flex-1 h-11"
						variant="outline"
						disabled={isProcessing}
						onclick={handleDeny}
					>
						{#if isProcessing}
							<BarSpinner size={16} class="mr-2" />
						{/if}
						Deny Access
					</Button>
					<Button 
						class="flex-1 h-11 shadow-md hover:shadow-lg transition-all" 
						disabled={isProcessing} 
						onclick={handleApprove}
					>
						{#if isProcessing}
							<BarSpinner size={16} class="mr-2" />
						{/if}
						Approve Device
					</Button>
				</div>

				<p class="text-xs text-center text-muted-foreground px-4">
					<strong class="text-foreground/80">Security Note:</strong> Only approve if you initiated the sign-in on the device displaying this code.
				</p>
			{/if}
		</div>
	</div>
</div>

<svelte:head>
	<title>Approve Device | Nota</title>
	<meta
		name="description"
		content="Approve or deny a device requesting access to your Nota account."
	/>
</svelte:head>
