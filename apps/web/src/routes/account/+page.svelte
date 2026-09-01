<script lang="ts">
import ArrowLeft from "@lucide/svelte/icons/arrow-left";
import ChevronLeft from "@lucide/svelte/icons/chevron-left";
import ChevronRight from "@lucide/svelte/icons/chevron-right";
import Coins from "@lucide/svelte/icons/coins";
import CreditCard from "@lucide/svelte/icons/credit-card";
import Fingerprint from "@lucide/svelte/icons/fingerprint";
import Key from "@lucide/svelte/icons/key";
import Laptop from "@lucide/svelte/icons/laptop";
import LayoutGrid from "@lucide/svelte/icons/layout-grid";
import Link2 from "@lucide/svelte/icons/link-2";
import Lock from "@lucide/svelte/icons/lock";
import Plus from "@lucide/svelte/icons/plus";
import Shield from "@lucide/svelte/icons/shield";
import Trash2 from "@lucide/svelte/icons/trash-2";
import UserIcon from "@lucide/svelte/icons/user";
import { toast } from "@nota/ui";
import { BarSpinner, Github, Google } from "@nota/ui/icons/index.ts";
import * as Avatar from "@nota/ui/shadcn/avatar/index.ts";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import * as Card from "@nota/ui/shadcn/card/index.ts";
import { Checkbox } from "@nota/ui/shadcn/checkbox/index.ts";
import * as Dialog from "@nota/ui/shadcn/dialog/index.ts";
import { Input } from "@nota/ui/shadcn/input/index.ts";
import { Label } from "@nota/ui/shadcn/label/index.ts";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.ts";
import * as Table from "@nota/ui/shadcn/table/index.ts";
import { createQuery } from "@tanstack/svelte-query";
import type { Session } from "better-auth";
import Particles from "#components/custom/landing/particles.svelte";
import { authClient } from "#lib/auth-client.ts";
import { client, orpc } from "#lib/orpc.ts";
import { PUBLIC_NOTA_APP_URL } from "$app/env/public";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

const sessionQuery = authClient.useSession();
const userQuota = createQuery(() => orpc.userquota.getQuota.queryOptions());

// ── Linked Accounts State ───────────────────────────────────────────────────
type LinkedAccount = {
	id: string;
	providerId: string;
	accountId: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
};

let accounts = $state<LinkedAccount[]>([]);
let loadingAccounts = $state(true);
let linkingProvider = $state<"google" | "github" | null>(null);
let unlinkingProvider = $state<"google" | "github" | null>(null);

const hasPasswordAccount = $derived(
	accounts.some((a) => a.providerId === "credential"),
);
const isGoogleLinked = $derived(
	accounts.some((a) => a.providerId === "google"),
);
const isGithubLinked = $derived(
	accounts.some((a) => a.providerId === "github"),
);

async function loadAccounts() {
	try {
		loadingAccounts = true;
		const res = await authClient.listAccounts();
		if (res.data) accounts = res.data as LinkedAccount[];
		if (res.error) console.error(res.error);
	} catch (error) {
		console.error("Failed to load accounts:", error);
	} finally {
		loadingAccounts = false;
	}
}

async function handleLinkSocial(provider: "google" | "github") {
	try {
		linkingProvider = provider;
		await authClient.linkSocial({
			provider,
			callbackURL: window.location.href,
		});
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : `Failed to link ${provider}`;
		toast.error(message);
		linkingProvider = null;
	}
}

async function handleUnlinkAccount(provider: "google" | "github") {
	// Prevent unlinking if it is the only login method and user has no password
	const totalAuthMethods = accounts.length + passkeys.length;
	if (totalAuthMethods <= 1) {
		toast.error(
			"Cannot unlink your only login method. Please add a password or another login method first.",
		);
		return;
	}

	try {
		unlinkingProvider = provider;
		const targetAccount = accounts.find((a) => a.providerId === provider);
		if (!targetAccount) {
			toast.error(`No linked ${provider} account found.`);
			return;
		}

		const res = await authClient.unlinkAccount({
			accountId: targetAccount.accountId || targetAccount.id,
		});
		if (res.error) {
			toast.error(res.error.message || `Failed to unlink ${provider}`);
			return;
		}
		toast.success(
			`Unlinked ${provider === "google" ? "Google" : "GitHub"} account`,
		);
		await loadAccounts();
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : `Failed to unlink ${provider}`;
		toast.error(message);
	} finally {
		unlinkingProvider = null;
	}
}

// ── Sessions State ──────────────────────────────────────────────────────────
let sessions = $state<Session[]>([]);
let loadingSessions = $state(true);
let revokingSessionId = $state<string | null>(null);
let revokingOtherSessions = $state(false);

async function loadSessions() {
	try {
		loadingSessions = true;
		const res = await authClient.listSessions();
		if (res.data) sessions = res.data;
		if (res.error) console.error(res.error);
	} catch {
		toast.error("Failed to load sessions");
	} finally {
		loadingSessions = false;
	}
}

async function revokeSession(session: Session) {
	try {
		revokingSessionId = session.id;
		const res = await authClient.revokeSession({ token: session.token });
		if (res.error) throw res.error;
		toast.success("Session revoked");
		sessions = sessions.filter((s) => s.id !== session.id);
	} catch {
		toast.error("Failed to revoke session");
	} finally {
		if (revokingSessionId === session.id) {
			revokingSessionId = null;
		}
	}
}

async function revokeOtherSessions() {
	try {
		revokingOtherSessions = true;
		const res = await authClient.revokeOtherSessions();
		if (res.error) throw res.error;
		toast.success("Other sessions revoked");
		await loadSessions();
	} catch {
		toast.error("Failed to revoke other sessions");
	} finally {
		revokingOtherSessions = false;
	}
}

// ── Passkeys State ──────────────────────────────────────────────────────────
type PasskeyItem = {
	id: string;
	name?: string | null;
	createdAt?: string | Date | null;
	deviceType?: string | null;
	backedUp?: boolean | null;
	transports?: string | null;
	aaguid?: string | null;
};

let passkeys = $state<PasskeyItem[]>([]);
let loadingPasskeys = $state(true);
let passkeyDialogOpen = $state(false);
let newPasskeyName = $state("");
let addingPasskey = $state(false);
let deletingPasskeyId = $state<string | null>(null);

async function loadPasskeys() {
	try {
		loadingPasskeys = true;
		const res = await authClient.passkey.listUserPasskeys();
		if (res.data) passkeys = res.data as PasskeyItem[];
		if (res.error) console.error(res.error);
	} catch (error) {
		console.error("Failed to load passkeys:", error);
	} finally {
		loadingPasskeys = false;
	}
}

async function handleAddPasskey(e?: SubmitEvent) {
	e?.preventDefault();
	try {
		addingPasskey = true;
		const name = newPasskeyName.trim() || undefined;
		const res = await authClient.passkey.addPasskey({
			name,
			context: "signed-registration-token",
			authenticatorAttachment: "cross-platform",
		});
		if (res.error) {
			toast.error(res.error.message || "Failed to add passkey");
			return;
		}
		toast.success("Passkey registered successfully");
		passkeyDialogOpen = false;
		newPasskeyName = "";
		await loadPasskeys();
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Failed to register passkey";
		toast.error(message);
	} finally {
		addingPasskey = false;
	}
}

async function handleDeletePasskey(id: string) {
	try {
		deletingPasskeyId = id;
		const res = await authClient.passkey.deletePasskey({ id });
		if (res.error) {
			toast.error(res.error.message || "Failed to delete passkey");
			return;
		}
		toast.success("Passkey removed");
		passkeys = passkeys.filter((p) => p.id !== id);
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Failed to remove passkey";
		toast.error(message);
	} finally {
		if (deletingPasskeyId === id) {
			deletingPasskeyId = null;
		}
	}
}

// ── Password Management State (Set vs Update) ───────────────────────────────
let currentPassword = $state("");
let newPassword = $state("");
let confirmPassword = $state("");
let revokeSessionsOnPasswordChange = $state(true);
let updatingPassword = $state(false);
let settingPassword = $state(false);

async function handleSetPassword(e: SubmitEvent) {
	e.preventDefault();
	if (!newPassword) {
		toast.error("Please enter a password");
		return;
	}
	if (newPassword.length < 8) {
		toast.error("Password must be at least 8 characters long");
		return;
	}
	if (newPassword !== confirmPassword) {
		toast.error("Passwords do not match");
		return;
	}

	try {
		settingPassword = true;
		await client.auth.setPassword({
			newPassword,
		});

		toast.success("Password set successfully!");
		newPassword = "";
		confirmPassword = "";
		await loadAccounts();
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Failed to set password";
		toast.error(message);
	} finally {
		settingPassword = false;
	}
}

async function handleUpdatePassword(e: SubmitEvent) {
	e.preventDefault();
	if (!currentPassword) {
		toast.error("Please enter your current password");
		return;
	}
	if (!newPassword) {
		toast.error("Please enter a new password");
		return;
	}
	if (newPassword.length < 8) {
		toast.error("New password must be at least 8 characters long");
		return;
	}
	if (newPassword !== confirmPassword) {
		toast.error("New passwords do not match");
		return;
	}

	try {
		updatingPassword = true;
		const res = await authClient.changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: revokeSessionsOnPasswordChange,
		});

		if (res.error) {
			toast.error(res.error.message || "Failed to update password");
			return;
		}

		toast.success("Password updated successfully");
		currentPassword = "";
		newPassword = "";
		confirmPassword = "";

		if (revokeSessionsOnPasswordChange) {
			await loadSessions();
		}
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "An unexpected error occurred";
		toast.error(message);
	} finally {
		updatingPassword = false;
	}
}

// ── AI Ledger Table State ───────────────────────────────────────────────────
const LEDGER_PAGE_SIZE = 10;
let ledgerPage = $state(0);

const ledgerQuery = createQuery(() =>
	orpc.ai.getLedger.queryOptions({
		input: {
			limit: LEDGER_PAGE_SIZE,
			offset: ledgerPage * LEDGER_PAGE_SIZE,
			order: "desc",
		},
	}),
);

const totalLedgerRecords = $derived(ledgerQuery.data?.total ?? 0);
const totalLedgerPages = $derived(
	Math.max(1, Math.ceil(totalLedgerRecords / LEDGER_PAGE_SIZE)),
);
const ledgerItems = $derived(ledgerQuery.data?.items ?? []);

function formatCentsToUSD(centsStringOrNum: string | number) {
	const cents = Number(centsStringOrNum);
	if (isNaN(cents)) return "$0.00";
	const dollars = cents / 100;
	if (dollars < 0.01 && dollars > 0) {
		return `$${dollars.toFixed(5)}`;
	}
	return `$${dollars.toFixed(4)}`;
}

// ── Portal and Helpers ──────────────────────────────────────────────────────
async function openCustomerPortal() {
	try {
		const res = await authClient.customer.portal();
		if (res.data?.url) {
			window.location.href = res.data.url;
		} else {
			toast.error("Failed to open customer portal");
		}
	} catch {
		toast.error("Failed to open customer portal");
	}
}

$effect(() => {
	if (
		!$sessionQuery.isRefetching &&
		!$sessionQuery.isPending &&
		!$sessionQuery.data?.session
	) {
		goto(resolve(`/signin?redirectTo=${encodeURIComponent("/account")}`));
	}

	if ($sessionQuery.data?.session) {
		if (accounts.length === 0 && loadingAccounts) {
			loadAccounts();
		}
		if (sessions.length === 0 && loadingSessions) {
			loadSessions();
		}
		if (passkeys.length === 0 && loadingPasskeys) {
			loadPasskeys();
		}
	}
});

const user = $derived($sessionQuery.data?.user);

function getBrowserIcon(userAgent?: string | null) {
	if (!userAgent) return null;
	const ua = userAgent.toLowerCase();
	if (ua.includes("tauri") || ua.includes("nota")) return "/favicon.svg";
	if (ua.includes("edg")) return "https://svgl.app/library/edge.svg";
	if (ua.includes("brave") || ua.includes("zen"))
		return "https://svgl.app/library/brave.svg";
	if (ua.includes("chrome") || ua.includes("crios"))
		return "https://svgl.app/library/chrome.svg";
	if (ua.includes("firefox") || ua.includes("fxios"))
		return "https://svgl.app/library/firefox.svg";
	if (ua.includes("safari")) return "https://svgl.app/library/safari.svg";
	return null;
}

function getDeviceName(userAgent?: string | null) {
	if (!userAgent) return "Unknown Device";
	const ua = userAgent.toLowerCase();
	if (ua.includes("tauri") || ua.includes("nota")) return "Nota Desktop";
	if (ua.includes("edg")) return "Edge";
	if (ua.includes("brave") || ua.includes("zen")) return "Brave / Zen";
	if (ua.includes("chrome") || ua.includes("crios")) return "Chrome";
	if (ua.includes("firefox") || ua.includes("fxios")) return "Firefox";
	if (ua.includes("safari")) return "Safari";
	return userAgent.split(" ")[0] || "Unknown Device";
}
</script>

<Particles class="fixed h-screen w-screen inset-0 -z-10" />

<div class="max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Account Settings</h1>
      <p class="text-muted-foreground mt-1">Manage your account profile, credentials, billing, and AI usage.</p>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" href="/">
        <ArrowLeft class="mr-2 w-4 h-4" />
        Home
      </Button>
      <Button href={PUBLIC_NOTA_APP_URL}>
        <LayoutGrid class="mr-2 w-4 h-4" />
        Open App
      </Button>
    </div>
  </div>

  {#if $sessionQuery.isPending}
    <div class="space-y-6">
      <Skeleton class="h-48 w-full rounded-xl" />
      <Skeleton class="h-48 w-full rounded-xl" />
    </div>
  {:else if user}
    <!-- Section 1: Profile & Subscription -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <!-- Profile Card -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <UserIcon class="w-5 h-5 text-primary" />
            Profile
          </Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col items-center gap-4 text-center">
          <Avatar.Root class="h-20 w-20">
            <Avatar.Image src={user.image ?? ""} alt={user.name} />
            <Avatar.Fallback class="text-2xl font-medium">{user.name?.charAt(0) || "U"}</Avatar.Fallback>
          </Avatar.Root>
          
          <div>
            <h3 class="text-xl font-semibold">{user.name}</h3>
            <p class="text-sm text-muted-foreground">{user.email}</p>
          </div>
          
          <div class="text-xs text-muted-foreground">
            Joined {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Subscription & Quota Card -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <CreditCard class="w-5 h-5 text-primary" />
            Subscription & Quota
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          {#if userQuota.isPending}
            <div class="space-y-3">
              <Skeleton class="h-5 w-1/2" />
              <Skeleton class="h-5 w-3/4" />
            </div>
          {:else}
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Current Plan</span>
              {#if userQuota.data?.planTier === "pro"}
                <Badge class="bg-primary text-primary-foreground font-semibold">Pro</Badge>
              {:else}
                <Badge variant="outline">Free</Badge>
              {/if}
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">AI Credit Balance</span>
              <span class="text-sm font-semibold">
                {#if userQuota.data?.aiCreditBalanceCents !== undefined}
                  ${(Number(userQuota.data.aiCreditBalanceCents) / 100).toFixed(2)}
                {:else}
                  $0.00
                {/if}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Cloud Storage</span>
              <span class="text-xs text-muted-foreground">
                {#if userQuota.data?.usedStorageBytes !== undefined && userQuota.data?.assignedStorageBytes}
                  {(userQuota.data.usedStorageBytes / (1024 * 1024)).toFixed(1)} MB / {(userQuota.data.assignedStorageBytes / (1024 * 1024)).toFixed(0)} MB
                {:else}
                  —
                {/if}
              </span>
            </div>
          {/if}
        </Card.Content>
        <Card.Footer>
          <Button class="w-full" variant="outline" onclick={openCustomerPortal}>Manage Billing</Button>
        </Card.Footer>
      </Card.Root>
    </div>

    <!-- Section 2: Password & Passkeys -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <!-- Password Card: Conditional (Add Password vs Update Password) -->
      {#if loadingAccounts}
        <Card.Root>
          <Card.Header>
            <Skeleton class="h-6 w-1/3" />
            <Skeleton class="h-4 w-2/3 mt-2" />
          </Card.Header>
          <Card.Content class="space-y-4">
            <Skeleton class="h-8 w-full" />
            <Skeleton class="h-8 w-full" />
          </Card.Content>
        </Card.Root>
      {:else if !hasPasswordAccount}
        <!-- Set / Add Password Card (For OAuth users) -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Lock class="w-5 h-5 text-primary" />
              Add Password
            </Card.Title>
            <Card.Description>
              Set a password to enable email & password sign-in for your account.
            </Card.Description>
          </Card.Header>
          <form onsubmit={handleSetPassword}>
            <Card.Content class="space-y-4">
              <div class="space-y-1.5">
                <Label for="set-new-password">Password</Label>
                <Input
                  id="set-new-password"
                  type="password"
                  placeholder="••••••••"
                  bind:value={newPassword}
                  required
                  autocomplete="new-password"
                />
                <p class="text-[11px] text-muted-foreground">Must be at least 8 characters long</p>
              </div>

              <div class="space-y-1.5">
                <Label for="set-confirm-password">Confirm Password</Label>
                <Input
                  id="set-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  bind:value={confirmPassword}
                  required
                  autocomplete="new-password"
                />
              </div>
            </Card.Content>
            <Card.Footer>
              <Button type="submit" class="w-full" disabled={settingPassword}>
                {#if settingPassword}
                  <BarSpinner class="w-4 h-4 mr-2" />
                  Setting Password...
                {:else}
                  Set Password
                {/if}
              </Button>
            </Card.Footer>
          </form>
        </Card.Root>
      {:else}
        <!-- Update Password Card (For users with existing password) -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Lock class="w-5 h-5 text-primary" />
              Update Password
            </Card.Title>
            <Card.Description>Change your account password securely.</Card.Description>
          </Card.Header>
          <form onsubmit={handleUpdatePassword}>
            <Card.Content class="space-y-4">
              <div class="space-y-1.5">
                <Label for="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  bind:value={currentPassword}
                  required
                  autocomplete="current-password"
                />
              </div>

              <div class="space-y-1.5">
                <Label for="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  bind:value={newPassword}
                  required
                  autocomplete="new-password"
                />
                <p class="text-[11px] text-muted-foreground">Must be at least 8 characters long</p>
              </div>

              <div class="space-y-1.5">
                <Label for="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  bind:value={confirmPassword}
                  required
                  autocomplete="new-password"
                />
              </div>

              <div class="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="revoke-sessions"
                  bind:checked={revokeSessionsOnPasswordChange}
                />
                <Label for="revoke-sessions" class="text-xs font-normal text-muted-foreground leading-snug cursor-pointer">
                  Revoke all other active sessions upon update
                </Label>
              </div>
            </Card.Content>
            <Card.Footer>
              <Button type="submit" class="w-full" disabled={updatingPassword}>
                {#if updatingPassword}
                  <BarSpinner class="w-4 h-4 mr-2" />
                  Updating Password...
                {:else}
                  Save Password
                {/if}
              </Button>
            </Card.Footer>
          </form>
        </Card.Root>
      {/if}

      <!-- Passkeys Card -->
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0">
          <div>
            <Card.Title class="flex items-center gap-2">
              <Fingerprint class="w-5 h-5 text-primary" />
              Passkeys
            </Card.Title>
            <Card.Description>Sign in securely using biometric data or hardware keys.</Card.Description>
          </div>
          <Dialog.Root bind:open={passkeyDialogOpen}>
            <Dialog.Trigger>
              {#snippet child({ props })}
                <Button size="sm" variant="outline" {...props}>
                  <Plus class="w-4 h-4 mr-1" />
                  Add
                </Button>
              {/snippet}
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Add a New Passkey</Dialog.Title>
                <Dialog.Description>
                  Register your device's biometric sensor (Touch ID, Face ID, Windows Hello) or security key.
                </Dialog.Description>
              </Dialog.Header>
              <form onsubmit={handleAddPasskey} class="space-y-4 py-2">
                <div class="space-y-2">
                  <Label for="passkey-name">Passkey Name (optional)</Label>
                  <Input
                    id="passkey-name"
                    placeholder="e.g. MacBook Touch ID, Work YubiKey"
                    bind:value={newPasskeyName}
                    autofocus
                  />
                </div>
                <Dialog.Footer>
                  <Button type="button" variant="ghost" onclick={() => (passkeyDialogOpen = false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addingPasskey}>
                    {#if addingPasskey}
                      <BarSpinner class="w-4 h-4 mr-2" />
                      Registering...
                    {:else}
                      Enroll Passkey
                    {/if}
                  </Button>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        </Card.Header>
        <Card.Content>
          {#if loadingPasskeys}
            <div class="space-y-3">
              <Skeleton class="h-14 w-full rounded-lg" />
              <Skeleton class="h-14 w-full rounded-lg" />
            </div>
          {:else if passkeys.length === 0}
            <div class="text-center py-6 border border-dashed rounded-lg bg-muted/20">
              <Key class="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
              <p class="text-sm font-medium">No passkeys registered</p>
              <p class="text-xs text-muted-foreground mt-0.5">Add a passkey for instant, passwordless sign-in.</p>
            </div>
          {:else}
            <div class="space-y-2.5">
              {#each passkeys as pk (pk.id)}
                <div class="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-muted rounded-full shrink-0">
                      <Key class="w-4 h-4 text-primary" />
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-sm font-medium truncate">
                        {pk.name || "Passkey"}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {pk.createdAt ? new Date(pk.createdAt).toLocaleDateString() : "Active"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deletingPasskeyId === pk.id}
                    onclick={() => handleDeletePasskey(pk.id)}
                    title="Remove passkey"
                  >
                    {#if deletingPasskeyId === pk.id}
                      <BarSpinner class="w-4 h-4 text-destructive" />
                    {:else}
                      <Trash2 class="w-4 h-4" />
                    {/if}
                  </Button>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Section 3: Connected Social Accounts & Active Sessions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <!-- Connected Accounts Card -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Link2 class="w-5 h-5 text-primary" />
            Connected Accounts
          </Card.Title>
          <Card.Description>Link your social accounts for quick, one-click sign-in.</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-3">
          {#if loadingAccounts}
            <Skeleton class="h-14 w-full rounded-lg" />
            <Skeleton class="h-14 w-full rounded-lg" />
          {:else}
            <!-- Google Item -->
            <div class="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div class="flex items-center gap-3">
                  <Google class="size-6!" />
                <div class="flex flex-col">
                  <span class="text-sm font-medium">Google</span>
                  <span class="text-xs text-muted-foreground">
                    {isGoogleLinked ? "Account connected" : "Not connected"}
                  </span>
                </div>
              </div>
              <div>
                {#if isGoogleLinked}
                  <Button
                    variant="outline"
                    size="sm"
                    class="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                    disabled={unlinkingProvider === "google"}
                    onclick={() => handleUnlinkAccount("google")}
                  >
                    {#if unlinkingProvider === "google"}
                      <BarSpinner class="w-3.5 h-3.5 mr-1" />
                      Disconnecting...
                    {:else}
                      Disconnect
                    {/if}
                  </Button>
                {:else}
                  <Button
                    variant="outline"
                    size="sm"
                    class="text-xs"
                    disabled={linkingProvider === "google"}
                    onclick={() => handleLinkSocial("google")}
                  >
                    {#if linkingProvider === "google"}
                      <BarSpinner class="w-3.5 h-3.5 mr-1" />
                      Connecting...
                    {:else}
                      Connect
                    {/if}
                  </Button>
                {/if}
              </div>
            </div>

            <!-- GitHub Item -->
            <div class="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div class="flex items-center gap-3">
                  <Github class="size-6!" />
                <div class="flex flex-col">
                  <span class="text-sm font-medium">GitHub</span>
                  <span class="text-xs text-muted-foreground">
                    {isGithubLinked ? "Account connected" : "Not connected"}
                  </span>
                </div>
              </div>
              <div>
                {#if isGithubLinked}
                  <Button
                    variant="outline"
                    size="sm"
                    class="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                    disabled={unlinkingProvider === "github"}
                    onclick={() => handleUnlinkAccount("github")}
                  >
                    {#if unlinkingProvider === "github"}
                      <BarSpinner class="w-3.5 h-3.5 mr-1" />
                      Disconnecting...
                    {:else}
                      Disconnect
                    {/if}
                  </Button>
                {:else}
                  <Button
                    variant="outline"
                    size="sm"
                    class="text-xs"
                    disabled={linkingProvider === "github"}
                    onclick={() => handleLinkSocial("github")}
                  >
                    {#if linkingProvider === "github"}
                      <BarSpinner class="w-3.5 h-3.5 mr-1" />
                      Connecting...
                    {:else}
                      Connect
                    {/if}
                  </Button>
                {/if}
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Active Sessions Card -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Shield class="w-5 h-5 text-primary" />
            Active Sessions
          </Card.Title>
          <Card.Description>Manage devices currently logged into your account.</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if loadingSessions}
            <div class="space-y-3">
              <Skeleton class="h-14 w-full rounded-lg" />
              <Skeleton class="h-14 w-full rounded-lg" />
            </div>
          {:else}
            <div class="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {#each sessions as session (session.id)}
                {@const iconUrl = getBrowserIcon(session.userAgent)}
                <div class="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="p-2 bg-muted rounded-full overflow-hidden shrink-0">
                      {#if iconUrl}
                        <img src={iconUrl} class="w-4 h-4 object-contain" alt="browser" />
                      {:else}
                        <Laptop class="w-4 h-4 text-muted-foreground" />
                      {/if}
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-sm font-medium truncate">
                        {getDeviceName(session.userAgent)}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div class="shrink-0 ml-2">
                    {#if session.id === $sessionQuery.data?.session?.id}
                      <Badge variant="secondary">Current</Badge>
                    {:else}
                      <Button
                        variant="ghost"
                        size="icon"
                        class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onclick={() => revokeSession(session)}
                        title="Revoke session"
                      >
                        {#if revokingSessionId === session.id}
                          <BarSpinner class="w-4 h-4 text-destructive" />
                        {:else}
                          <Trash2 class="w-4 h-4" />
                        {/if}
                      </Button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
        <Card.Footer>
          <Button
            variant="destructive"
            class="w-full text-xs"
            disabled={sessions.length <= 1 || revokingOtherSessions}
            onclick={revokeOtherSessions}
          >
            {#if revokingOtherSessions}
              <BarSpinner class="w-4 h-4 mr-2" />
              Revoking Other Sessions...
            {:else}
              Revoke All Other Sessions
            {/if}
          </Button>
        </Card.Footer>
      </Card.Root>
    </div>

    <!-- Section 4: AI Usage Ledger Table -->
    <Card.Root>
      <Card.Header class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <Card.Title class="flex items-center gap-2">
            <Coins class="w-5 h-5 text-primary" />
            AI Usage & Credit Ledger
          </Card.Title>
          <Card.Description>Detailed audit history of AI requests and credit deductions.</Card.Description>
        </div>
        {#if totalLedgerRecords > 0}
          <Badge variant="outline" class="w-fit text-xs">
            {totalLedgerRecords} total {totalLedgerRecords === 1 ? 'event' : 'events'}
          </Badge>
        {/if}
      </Card.Header>
      <Card.Content>
        {#if ledgerQuery.isPending}
          <div class="space-y-2">
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
          </div>
        {:else if ledgerItems.length === 0}
          <div class="text-center py-8 border border-dashed rounded-lg bg-muted/20">
            <Coins class="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
            <p class="text-sm font-medium">No AI usage recorded yet</p>
            <p class="text-xs text-muted-foreground mt-0.5">Your AI completions and credit deductions will appear here.</p>
          </div>
        {:else}
          <div class="rounded-md border">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head class="w-45">Date & Time</Table.Head>
                  <Table.Head>Description</Table.Head>
                  <Table.Head class="text-right">Tokens (In / Out)</Table.Head>
                  <Table.Head class="text-right w-28">Cost</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each ledgerItems as item (item.id)}
                  <Table.Row>
                    <Table.Cell class="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Table.Cell>
                    <Table.Cell class="font-medium text-sm">
                      {item.description || "AI Completion"}
                    </Table.Cell>
                    <Table.Cell class="text-right text-xs font-mono text-muted-foreground whitespace-nowrap">
                      <span class="text-foreground">{item.inputTokens.toLocaleString()}</span> in /
                      <span class="text-foreground">{item.outputTokens.toLocaleString()}</span> out
                    </Table.Cell>
                    <Table.Cell class="text-right font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                      {formatCentsToUSD(item.totalCostCents)}
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>

          <!-- Pagination Controls -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
            <div>
              Showing {ledgerItems.length > 0 ? ledgerPage * LEDGER_PAGE_SIZE + 1 : 0} to
              {Math.min((ledgerPage + 1) * LEDGER_PAGE_SIZE, totalLedgerRecords)} of {totalLedgerRecords} entries
            </div>

            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ledgerPage === 0 || ledgerQuery.isPending}
                onclick={() => {
                  if (ledgerPage > 0) ledgerPage--;
                }}
              >
                <ChevronLeft class="w-4 h-4 mr-1" />
                Previous
              </Button>

              <span class="text-xs px-2 font-medium">
                Page {ledgerPage + 1} of {totalLedgerPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={ledgerPage >= totalLedgerPages - 1 || ledgerQuery.isPending}
                onclick={() => {
                  if (ledgerPage < totalLedgerPages - 1) ledgerPage++;
                }}
              >
                Next
                <ChevronRight class="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>


