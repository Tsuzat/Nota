<script lang="ts">
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@lib/components/ui/avatar/index.js";
  import { Button } from "@lib/components/ui/button/index.js";
  import { Input } from "@lib/components/ui/input/index.js";
  import { Label } from "@lib/components/ui/label/index.js";
  import * as Popover from "@lib/components/ui/popover/index.js";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "@lib/components/ui/select/index.js";
  import * as Tabs from "@lib/components/ui/tabs/index.js";
  import SimpleToolTip from "./SimpleToolTip.svelte";
  import { BarSpinner } from "@lib/icons";

  import ClockIcon from "@lucide/svelte/icons/clock";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import GlobeIcon from "@lucide/svelte/icons/globe";
  import LinkIcon from "@lucide/svelte/icons/link";
  import LockIcon from "@lucide/svelte/icons/lock";
  import Share2Icon from "@lucide/svelte/icons/share-2";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserPlusIcon from "@lucide/svelte/icons/user-plus";

  // ── Types ──────────────────────────────────────────────
  export interface CollaboratorMember {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    role: string;
  }

  export interface ActiveUser {
    clientId: number;
    name: string;
    avatar?: string;
    color: string;
    userId?: string;
  }

  interface Props {
    // Collaborators
    members: CollaboratorMember[];
    isLoadingMembers?: boolean;
    onAddMember?: (email: string, role: string) => Promise<void>;
    onRemoveMember?: (id: string) => Promise<void>;
    onUpdateRole?: (id: string, role: string) => Promise<void>;
    
    // Active Users
    activeUsers?: ActiveUser[];
    connectionStatus?: 'connecting' | 'connected' | 'disconnected';
    currentUserId?: string;

    // Public access
    isPublic: boolean;
    onTogglePublic?: () => void;
    publicUrl?: string;
    // Versions
    versionCount?: number;
    versionsHref?: string;
  }

  let {
    members = [],
    isLoadingMembers = false,
    onAddMember,
    onRemoveMember,
    onUpdateRole,
    activeUsers,
    connectionStatus = 'connecting',
    currentUserId,
    isPublic = false,
    onTogglePublic,
    publicUrl = "",
    versionCount = 0,
    versionsHref = "",
  }: Props = $props();

  // ── Local state ────────────────────────────────────────
  let shareOpen = $state(false);
  let inviteEmail = $state("");
  let inviteRole = $state("editor");
  let isAdding = $state(false);
  let copied = $state(false);

  // ── Helpers ────────────────────────────────────────────
  function getInitials(name?: string | null, email?: string): string {
    if (name) {
      const parts = name.split(" ");
      return (
        (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
      ).toUpperCase();
    }
    return email?.[0]?.toUpperCase() ?? "?";
  }

  async function handleAdd() {
    if (!inviteEmail || !onAddMember) return;
    isAdding = true;
    try {
      await onAddMember(inviteEmail, inviteRole);
      inviteEmail = "";
    } finally {
      isAdding = false;
    }
  }

  async function handleCopyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  const userCount = $derived(activeUsers?.length || (connectionStatus === 'connected' ? 1 : 0));
  const visibleUsers = $derived((activeUsers || []).slice(0, 3));
  const overflowCount = $derived(Math.max(0, (activeUsers || []).length - 3));
  const statusLabel = $derived(
    connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'
  );
</script>

<div class="flex items-center gap-1">
  <!-- ── Active Users Group ──────────────────────────────────── -->
  {#if activeUsers}
    <Popover.Root>
      <Popover.Trigger
        class="inline-flex h-8 items-center gap-2 rounded-full border px-2.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none mr-1 {connectionStatus === 'connected' ? 'border-border bg-card' : connectionStatus === 'connecting' ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-destructive/30 bg-destructive/10 text-destructive'}"
        aria-label="Collaborators"
      >
        <span class="relative flex size-2 shrink-0">
          {#if connectionStatus === 'connected'}
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
            <span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
          {:else if connectionStatus === 'connecting'}
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60"></span>
            <span class="relative inline-flex size-2 rounded-full bg-amber-500"></span>
          {:else}
            <span class="relative inline-flex size-2 rounded-full bg-destructive"></span>
          {/if}
        </span>

        {#if connectionStatus === 'connected' && activeUsers.length}
          <span class="hidden items-center -space-x-1.5 sm:flex">
            {#each visibleUsers as member (member.clientId ?? member.name)}
              <Avatar class="h-6 w-6 border-2 border-background shadow-sm">
                <AvatarImage src={member.avatar ?? ""} alt={member.name ?? "User"} />
                <AvatarFallback class="text-[10px]" style="background-color: {member.color}; color: white;">
                  {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
            {/each}
            {#if overflowCount > 0}
              <span class="grid size-6 place-items-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
                +{overflowCount}
              </span>
            {/if}
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="tabular-nums">{userCount}</span>
          </span>
        {:else}
          <span class="capitalize">{statusLabel}</span>
        {/if}
      </Popover.Trigger>

      <Popover.Content class="w-80 p-0" align="end" sideOffset={8}>
        <div class="flex items-center justify-between border-b px-3 py-2.5">
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full {connectionStatus === 'connected' ? 'bg-emerald-500' : connectionStatus === 'connecting' ? 'bg-amber-500' : 'bg-destructive'}"></span>
            <span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{statusLabel}</span>
            <span class="text-xs text-muted-foreground">·</span>
            <span class="text-xs font-medium tabular-nums">{userCount} {userCount === 1 ? 'person' : 'people'}</span>
          </div>
        </div>

        <div class="max-h-72 overflow-y-auto p-2">
          {#if activeUsers.length}
            <ul class="space-y-0.5 m-0 p-0 list-none">
              {#each activeUsers as u (u.clientId ?? u.name)}
                <li class="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60">
                  <Avatar class="h-8 w-8 shadow-sm">
                    <AvatarImage src={u.avatar ?? ""} alt={u.name ?? "User"} />
                    <AvatarFallback class="text-[12px] font-bold" style="background-color: {u.color}; color: white;">
                      {u.name ? u.name.charAt(0).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="truncate text-sm leading-none font-medium">{u.name || "Unknown"}</span>
                      {#if u.userId && currentUserId && u.userId === currentUserId}
                        <span class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary">You</span>
                      {/if}
                    </div>
                    <span class="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                      <span class="size-1 rounded-full bg-emerald-500"></span> Active now
                    </span>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="px-2 py-6 text-center text-xs text-muted-foreground">
              No active collaborators.
            </p>
          {/if}
        </div>
      </Popover.Content>
    </Popover.Root>
  {/if}

  <!-- ── Share Popover ─────────────────────────────────── -->
  <Popover.Root bind:open={shareOpen}>
    <Popover.Trigger>
      <Button variant="outline" size="sm" class="gap-1.5">
        <Share2Icon class="size-3.5" />
        Share
      </Button>
    </Popover.Trigger>
    <Popover.Content align="end" class="w-100 p-0">
      <Tabs.Root value="share" class="w-full">
        <Tabs.List class="w-full rounded-none border-b">
          <Tabs.Trigger value="share" class="flex-1">Share</Tabs.Trigger>
          <Tabs.Trigger value="people" class="flex-1">
            People
            {#if members.length > 0}
              <span class="ml-1 text-xs text-muted-foreground"
                >({members.length})</span
              >
            {/if}
          </Tabs.Trigger>
        </Tabs.List>

        <!-- Share Tab -->
        <Tabs.Content value="share" class="p-4 space-y-4">
          <!-- Public access toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              {#if isPublic}
                <GlobeIcon class="size-4 text-green-500" />
              {:else}
                <LockIcon class="size-4 text-muted-foreground" />
              {/if}
              <div>
                <p class="text-sm font-medium">
                  {isPublic ? "Public access" : "Private"}
                </p>
                <p class="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone with the link can view"
                    : "Only invited people can access"}
                </p>
              </div>
            </div>
            <Button
              variant={isPublic ? "outline" : "default"}
              size="sm"
              onclick={onTogglePublic}
            >
              {isPublic ? "Make Private" : "Make Public"}
            </Button>
          </div>

          <!-- Copy link (when public) -->
          {#if isPublic && publicUrl}
            <div
              class="flex items-center gap-2 rounded-md border bg-muted/50 p-2"
            >
              <LinkIcon class="size-3.5 shrink-0 text-muted-foreground" />
              <span class="flex-1 truncate text-xs text-muted-foreground">
                {publicUrl}
              </span>
              <Button
                variant="ghost"
                size="sm"
                class="h-7 px-2"
                onclick={handleCopyLink}
              >
                {#if copied}
                  <span class="text-xs text-green-500">Copied!</span>
                {:else}
                  <CopyIcon class="size-3.5" />
                {/if}
              </Button>
            </div>
          {/if}

          <!-- Invite by email -->
          <div class="space-y-2">
            <Label>Invite by email</Label>
            <div class="flex items-center gap-2">
              <Input
                bind:value={inviteEmail}
                placeholder="jane@example.com"
                type="email"
                class="flex-1"
                onkeydown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
              <Select type="single" bind:value={inviteRole}>
                <SelectTrigger class="w-24">
                  <span class="capitalize">{inviteRole}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                onclick={handleAdd}
                disabled={isAdding || !inviteEmail}
              >
                {#if isAdding}
                  <BarSpinner />
                {:else}
                  <UserPlusIcon class="size-4" />
                {/if}
              </Button>
            </div>
          </div>
        </Tabs.Content>

        <!-- People Tab -->
        <Tabs.Content value="people" class="p-4">
          {#if isLoadingMembers && members.length === 0}
            <div class="flex justify-center p-4">
              <BarSpinner />
            </div>
          {:else if members.length === 0}
            <p class="py-4 text-center text-sm text-muted-foreground">
              Only you have access to this note.
            </p>
          {:else}
            <div class="max-h-64 space-y-3 overflow-auto">
              {#each members as member (member.id)}
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-3 min-w-0">
                    <Avatar class="h-8 w-8 shrink-0">
                      <AvatarImage src={member.avatar_url ?? ""} />
                      <AvatarFallback class="text-xs">
                        {getInitials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div class="flex flex-col min-w-0">
                      <span class="truncate text-sm font-medium leading-none">
                        {member.name || "Unknown"}
                      </span>
                      <span class="truncate text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <Select
                      type="single"
                      value={member.role}
                      onValueChange={(v) => onUpdateRole?.(member.id, v)}
                    >
                      <SelectTrigger class="w-22 h-8 text-xs">
                        <span class="capitalize">{member.role}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      onclick={() => onRemoveMember?.(member.id)}
                    >
                      <Trash2Icon class="size-3.5" />
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Tabs.Content>
      </Tabs.Root>
    </Popover.Content>
  </Popover.Root>

  <!-- ── Versions Icon ─────────────────────────────────── -->
  {#if versionsHref}
    <SimpleToolTip>
      <a
        href={versionsHref}
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ClockIcon class="size-4" />
      </a>
      {#snippet child()}
        <span>
          {versionCount > 0
            ? `${versionCount} ${versionCount === 1 ? "version" : "versions"}`
            : "Version history"}
        </span>
      {/snippet}
    </SimpleToolTip>
  {/if}
</div>
