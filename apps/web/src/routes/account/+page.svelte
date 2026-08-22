<script lang="ts">
import ArrowLeft from "@lucide/svelte/icons/arrow-left";
import CreditCard from "@lucide/svelte/icons/credit-card";
import Laptop from "@lucide/svelte/icons/laptop";
import LayoutGrid from "@lucide/svelte/icons/layout-grid";
import Shield from "@lucide/svelte/icons/shield";
import Trash2 from "@lucide/svelte/icons/trash-2";
import UserIcon from "@lucide/svelte/icons/user";
import { toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.ts";
import * as Avatar from "@nota/ui/shadcn/avatar/index.ts";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import * as Card from "@nota/ui/shadcn/card/index.ts";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.ts";
import { createQuery } from "@tanstack/svelte-query";
import { authClient } from "#lib/auth-client.ts";
import { orpc } from "#lib/orpc.ts";
import { PUBLIC_NOTA_APP_URL } from "$app/env/public";
import { goto } from "$app/navigation";

const sessionQuery = authClient.useSession();
const userQuota = createQuery(() => orpc.userquota.getQuota.queryOptions());

let sessions = $state<any[]>([]);
let loadingSessions = $state(true);
let revokingSessionId = $state<string | null>(null);
let revokingOtherSessions = $state(false);

async function loadSessions() {
	try {
		loadingSessions = true;
		const res = await authClient.listSessions();
		if (res.data) sessions = res.data;
		if (res.error) console.log(res.error);
	} catch (e) {
		toast.error("Failed to load sessions");
	} finally {
		loadingSessions = false;
	}
}

async function revokeSession(session: any) {
	try {
		revokingSessionId = session.id;
		const res = await authClient.revokeSession({ token: session.token });
		if (res.error) throw res.error;
		toast.success("Session revoked");
		sessions = sessions.filter((s) => s.id !== session.id);
	} catch (e) {
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
	} catch (e) {
		toast.error("Failed to revoke other sessions");
	} finally {
		revokingOtherSessions = false;
	}
}

async function openCustomerPortal() {
	try {
		const res = await authClient.customer.portal();
		if (res.data?.url) {
			window.location.href = res.data.url;
		} else {
			toast.error("Failed to open customer portal");
		}
	} catch (error) {
		toast.error("Failed to open customer portal");
	}
}

$effect(() => {
	if (
		!$sessionQuery.isRefetching &&
		!$sessionQuery.isPending &&
		!$sessionQuery.data?.session
	) {
		goto("/signin");
	}

	if ($sessionQuery.data?.session && sessions.length === 0 && loadingSessions) {
		loadSessions();
	}
});

const user = $derived($sessionQuery.data?.user);

function getBrowserIcon(userAgent: string) {
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

function getDeviceName(userAgent: string) {
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

<div class="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Account Settings</h1>
      <p class="text-muted-foreground mt-2">Manage your account profile, billing, and security settings.</p>
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
      <Skeleton class="h-50 w-full rounded-xl" />
      <Skeleton class="h-50 w-full rounded-xl" />
    </div>
  {:else if user}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      
      <!-- Profile & Billing Column -->
      <div class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <UserIcon class="w-5 h-5" />
              Profile
            </Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-col items-center gap-4 text-center">
            <Avatar.Root class="h-24 w-24">
              <Avatar.Image src={user.image ?? ""} alt={user.name} />
              <Avatar.Fallback class="text-2xl">{user.name?.charAt(0) || "U"}</Avatar.Fallback>
            </Avatar.Root>
            
            <div>
              <h3 class="text-xl font-semibold">{user.name}</h3>
              <p class="text-muted-foreground">{user.email}</p>
            </div>
            
            <div class="text-sm text-muted-foreground mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <CreditCard class="w-5 h-5" />
              Subscription & Quota
            </Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            {#if userQuota.isPending}
              <div class="space-y-2">
                  <Skeleton class="h-5 w-1/2" />
                  <Skeleton class="h-5 w-3/4" />
              </div>
            {:else}
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Plan</span>
                {#if userQuota.data?.planTier === "pro"}
                  <Badge class="bg-primary text-primary-foreground">Pro</Badge>
                {:else}
                  <Badge variant="outline">Free</Badge>
                {/if}
              </div>
              {#if userQuota.data?.aiCreditBalanceCents}
                <div class="flex items-center justify-between mt-2">
                    <span class="text-sm font-medium">AI Credits</span>
                    <span class="text-sm font-semibold">${(userQuota.data.aiCreditBalanceCents / 100).toFixed(2)}</span>
                </div>
              {/if}
            {/if}
          </Card.Content>
          <Card.Footer>
            <Button class="w-full" variant="outline" onclick={openCustomerPortal}>Manage Billing</Button>
          </Card.Footer>
        </Card.Root>
      </div>

      <!-- Security Column -->
      <div class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
                <Shield class="w-5 h-5" />
                Security & Sessions
            </Card.Title>
            <Card.Description>Manage your active devices and sessions.</Card.Description>
          </Card.Header>
          <Card.Content>
            {#if loadingSessions}
              <div class="space-y-3">
                <Skeleton class="h-16 w-full rounded-lg" />
                <Skeleton class="h-16 w-full rounded-lg" />
              </div>
            {:else}
              <div class="space-y-4">
                {#each sessions as session (session.id)}
                  {@const iconUrl = getBrowserIcon(session.userAgent)}
                  <div class="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-muted rounded-full overflow-hidden shrink-0">
                        {#if iconUrl}
                          <img src={iconUrl} class="w-4 h-4 object-contain" alt="browser" />
                        {:else}
                          <Laptop class="w-4 h-4 text-muted-foreground" />
                        {/if}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-medium">
                          {getDeviceName(session.userAgent)}
                        </span>
                        <span class="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {#if session.id === $sessionQuery.data?.session?.id}
                      <Badge variant="secondary">Current</Badge>
                    {:else}
                      <Button variant="ghost" size="icon" class="text-destructive hover:bg-destructive/10 hover:text-destructive" onclick={() => revokeSession(session)}>
                        {#if revokingSessionId === session.id}
                          <BarSpinner class="w-4 h-4 text-destructive" />
                        {:else}
                          <Trash2 class="w-4 h-4" />
                        {/if}
                      </Button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </Card.Content>
          <Card.Footer>
            <Button variant="destructive" class="w-full" disabled={sessions.length <= 1 || revokingOtherSessions} onclick={revokeOtherSessions}>
              {#if revokingOtherSessions}
                <BarSpinner class="w-4 h-4 mr-2" />
                Revoking...
              {:else}
                Revoke All Other Sessions
              {/if}
            </Button>
          </Card.Footer>
        </Card.Root>
      </div>

    </div>
  {/if}
</div>
