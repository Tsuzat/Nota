<script lang="ts" module>
let open = $state(false);
export const openSigninDevice = () => {
	open = true;
};
</script>

<script lang="ts">
import {
	Dialog,
	DialogContent,
} from "@nota/ui/shadcn/dialog/index.ts";
import type { DeviceAuthState } from "#lib/device-auth.ts";
import { startDeviceAuth } from "#lib/device-auth.ts";
import { Button } from "@nota/ui/shadcn/button/index.js";
import { fade, scale, slide } from "svelte/transition";
import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
import MonitorSmartphone from "@lucide/svelte/icons/monitor-smartphone";
import RefreshCw from "@lucide/svelte/icons/refresh-cw";
import AlertCircle from "@lucide/svelte/icons/alert-circle";
import Copy from "@lucide/svelte/icons/copy";
import Check from "@lucide/svelte/icons/check";
  import { getAuthSession } from "#lib/auth-session.svelte.ts";

let stat = $state<DeviceAuthState>({ status: "idle" });
let copied = $state(false);
const session = getAuthSession();

function handleStateChange(newState: DeviceAuthState) {
	stat = newState;
	if (newState.status === "success") {
		session.refetch();
		setTimeout(() => {
			open = false;
		}, 1000);
	}
}

function initiateAuth() {
	startDeviceAuth(handleStateChange);
}

async function copyCode() {
	if (stat.userCode) {
		await navigator.clipboard.writeText(stat.userCode);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
}

function retry() {
	stat = { status: "idle" };
}

// Reset state when dialog closes
$effect(() => {
	if (!open) {
		setTimeout(() => {
			stat = { status: "idle" };
		}, 300); // Reset after dialog close animation
	}
});
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-md overflow-hidden" showCloseButton={false}>
		<div class="relative flex flex-col items-center justify-center p-6 min-h-75">
			
			{#if stat.status === "idle"}
				<div 
					in:fade={{ duration: 300, delay: 150 }} 
					out:fade={{ duration: 150 }}
					class="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-8"
				>
					<div class="flex size-16 items-center justify-center rounded-full bg-primary/10">
						<MonitorSmartphone class="size-8 text-primary" />
					</div>
					<div class="text-center space-y-2">
						<h1 class="text-3xl font-bold tracking-tight">Sign in to Nota</h1>
						<p class="text-sm text-muted-foreground">
							Authenticate via your browser to get started.
						</p>
					</div>
					<Button onclick={initiateAuth} size="lg">
						Sign in with Browser
					</Button>
				</div>

			{:else if stat.status === "requesting"}
				<div 
					in:fade={{ duration: 300, delay: 150 }} 
					out:fade={{ duration: 150 }}
					class="absolute inset-0 flex flex-col items-center justify-center gap-4 py-8"
				>
					<div in:scale={{ duration: 300, start: 0.8 }} class="flex size-16 items-center justify-center rounded-full bg-muted">
						<div class="size-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
					</div>
					<div class="text-center space-y-1">
						<h2 class="text-lg font-semibold">Connecting</h2>
						<p class="text-sm text-muted-foreground">Requesting authorization…</p>
					</div>
				</div>

			{:else if stat.status === "pending" || stat.status === "polling"}
				<div 
					in:fade={{ duration: 400, delay: 150 }} 
					out:fade={{ duration: 150 }}
					class="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-6"
				>
					<div class="text-center space-y-1">
						<h2 class="text-xl font-bold">Authorize Device</h2>
						<p class="text-sm text-muted-foreground">
							Enter this code in your browser
						</p>
					</div>

					<button
						class="group relative mx-auto flex items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 px-8 py-5 transition-all hover:border-primary/50 hover:bg-muted/50 active:scale-[0.98]"
						onclick={copyCode}
						title="Click to copy"
					>
						<span class="font-mono text-4xl font-bold tracking-[0.2em] text-foreground">
							{stat.userCode?.slice(0, 4)}<span class="text-muted-foreground/40 mx-1">-</span>{stat.userCode?.slice(4)}
						</span>
						
						<div class="absolute -right-3 -top-3">
							{#if copied}
								<div in:scale out:fade class="rounded-full bg-green-500 p-1.5 text-white shadow-sm">
									<Check class="size-4" />
								</div>
							{:else}
								<div class="rounded-full bg-background border p-1.5 text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
									<Copy class="size-4" />
								</div>
							{/if}
						</div>
					</button>

					<div class="flex flex-col items-center justify-center gap-3 pt-2">
						{#if stat.status === "polling"}
							<div in:slide class="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-primary">
								<RefreshCw class="size-3.5 animate-spin" />
								<span class="text-xs font-medium animate-pulse">Waiting for approval</span>
							</div>
						{/if}

						<p class="text-xs text-muted-foreground text-center px-4">
							A browser window should have opened. If not,
							<a
								href={stat.verificationUri}
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-primary hover:underline underline-offset-4"
							>
								click here
							</a>.
						</p>
					</div>
				</div>

			{:else if stat.status === "success"}
				<div 
					in:fade={{ duration: 400 }} 
					out:fade={{ duration: 150 }}
					class="absolute inset-0 flex flex-col items-center justify-center gap-4 py-8"
				>
					<div in:scale={{ duration: 500, delay: 100, start: 0.5 }} class="flex size-20 items-center justify-center rounded-full bg-green-500/20 text-green-500 ring-8 ring-green-500/10">
						<CheckCircle2 class="size-10" />
					</div>
					<div in:slide={{ duration: 300, delay: 300 }} class="text-center space-y-1">
						<h2 class="text-xl font-bold text-green-600 dark:text-green-500">Signed In Successfully</h2>
						<p class="text-sm text-muted-foreground">Redirecting to your workspace…</p>
					</div>
				</div>

			{:else if stat.status === "error"}
				<div 
					in:fade={{ duration: 300, delay: 150 }} 
					out:fade={{ duration: 150 }}
					class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6"
				>
					<div in:scale class="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
						<AlertCircle class="size-8" />
					</div>
					<div class="text-center space-y-2 w-full">
						<h2 class="text-xl font-bold text-destructive">Sign In Failed</h2>
						<p class="text-sm text-muted-foreground bg-muted p-3 rounded-md border border-border/50">
							{stat.errorMessage}
						</p>
					</div>
					<Button onclick={retry} variant="outline" class="w-full gap-2">
						<RefreshCw class="size-4" />
						Try Again
					</Button>
				</div>
			{/if}
			
		</div>
	</DialogContent>
</Dialog>