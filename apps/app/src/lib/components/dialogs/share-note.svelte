<script lang="ts">
import Check from "@lucide/svelte/icons/check";
import Copy from "@lucide/svelte/icons/copy";
import Globe from "@lucide/svelte/icons/globe";
import Info from "@lucide/svelte/icons/info";
import Share2 from "@lucide/svelte/icons/share-2";
import Trash2 from "@lucide/svelte/icons/trash-2";
import UserPlus from "@lucide/svelte/icons/user-plus";
import Users from "@lucide/svelte/icons/users";
import type { GuestRole } from "@nota/db/types";
import { toast } from "@nota/ui";
import { BarSpinner } from "@nota/ui/icons/index.js";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@nota/ui/shadcn/avatar/index.ts";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.ts";
import { Input } from "@nota/ui/shadcn/input/index.ts";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@nota/ui/shadcn/popover/index.ts";
import * as Select from "@nota/ui/shadcn/select/index.ts";
import { Separator } from "@nota/ui/shadcn/separator/index.ts";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@nota/ui/shadcn/tabs/index.ts";
import { onMount } from "svelte";
import { getAuthSession } from "#lib/auth-session.svelte.ts";
import { CloudGuests } from "#lib/data/cloud/guests.svelte.ts";
import { PUBLIC_APP_URL } from "$app/env/public";

let {
	noteId,
	class: className,
}: {
	noteId: string;
	class?: string;
} = $props();

const session = getAuthSession();
const currentUser = $derived(session.data?.user);

const guestsStore = new CloudGuests(noteId);

$effect(() => {
	guestsStore.noteId = noteId;
});

let open = $state(false);
let inviteEmail = $state("");
let inviteRole = $state<GuestRole>("editor");
let updatingUserId = $state<string | null>(null);
let copied = $state(false);

const roleDescriptions: Record<
	GuestRole,
	{
		label: string;
		description: string;
		badgeVariant?: "default" | "secondary" | "outline";
	}
> = {
	viewer: {
		label: "Viewer",
		description: "Can view note content in read-only mode.",
		badgeVariant: "outline",
	},
	comment: {
		label: "Commenter",
		description: "Can view note content and add comments.",
		badgeVariant: "outline",
	},
	editor: {
		label: "Editor",
		description: "Can view and edit note content collaboratively in real-time.",
		badgeVariant: "secondary",
	},
	admin: {
		label: "Admin",
		description: "Can edit note content and manage guest permissions.",
		badgeVariant: "default",
	},
};

const isOwner = $derived(
	currentUser && guestsStore.owner?.id === currentUser.id,
);
const currentGuestRole = $derived(
	currentUser
		? guestsStore.guests.find((g) => g.userId === currentUser.id)?.role
		: undefined,
);
const canManage = $derived(isOwner || currentGuestRole === "admin");

const handleInvite = async (e: SubmitEvent) => {
	e.preventDefault();
	if (!inviteEmail || !inviteEmail.includes("@")) {
		toast.error("Please enter a valid email address.");
		return;
	}

	try {
		await guestsStore.add({
			noteId,
			email: inviteEmail.trim(),
			role: inviteRole,
		});
		toast.success(
			`Invited ${inviteEmail} as ${roleDescriptions[inviteRole].label}`,
		);
		inviteEmail = "";
	} catch (err: unknown) {
		toast.error(err instanceof Error ? err.message : "Failed to invite guest");
	}
};

const handleUpdateRole = async (userId: string, newRole: GuestRole) => {
	updatingUserId = userId;
	try {
		await guestsStore.updateRole({
			noteId,
			userId,
			role: newRole,
		});
		toast.success("Guest role updated");
	} catch (err: unknown) {
		toast.error(err instanceof Error ? err.message : "Failed to update role");
	} finally {
		updatingUserId = null;
	}
};

const handleRemoveGuest = async (userId: string, email: string) => {
	updatingUserId = userId;
	try {
		await guestsStore.remove({
			noteId,
			userId,
		});
		toast.success(`Removed ${email} from note`);
	} catch (err: unknown) {
		toast.error(err instanceof Error ? err.message : "Failed to remove guest");
	} finally {
		updatingUserId = null;
	}
};

const handleCopyLink = () => {
	const url = `${PUBLIC_APP_URL}/p/${noteId}`;
	navigator.clipboard.writeText(url);
	copied = true;
	toast.success("Link copied to clipboard");
	setTimeout(() => {
		copied = false;
	}, 2000);
};

const getInitials = (name?: string | null) => {
	if (!name) return "?";
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
};
</script>

<Popover
  bind:open
  onOpenChange={(val: boolean) => {
    if (val) {
      guestsStore.fetch();
    }
  }}
>
  <PopoverTrigger>
    <Button
      variant="outline"
      size="sm"
      class="gap-1.5 h-8 font-medium text-xs {className}"
    >
      <Share2 class="size-3.5 text-muted-foreground" />
      <span>Share</span>
    </Button>
  </PopoverTrigger>

  <PopoverContent
    align="end"
    class="w-110 p-1! shadow-lg border rounded-xl overflow-hidden"
  >
    <Tabs value="guests" class="w-full">
        <TabsList class="grid grid-cols-2 w-full h-8">
          <TabsTrigger value="guests" class="text-xs gap-1.5">
            <Users />
            Manage Guests
          </TabsTrigger>
          <TabsTrigger value="publish" class="text-xs gap-1.5">
            <Globe />
            Publish Note
          </TabsTrigger>
        </TabsList>
      <!-- MANAGE GUESTS TAB -->
      <TabsContent
        value="guests"
        class="pt-3 space-y-4 focus-visible:outline-none"
      >
        {#if canManage}
          <form onsubmit={handleInvite} class="space-y-2.5">
            <div class="flex items-center gap-2">
              <Input
                type="email"
                placeholder="colleague@example.com"
                bind:value={inviteEmail}
                disabled={guestsStore.isAdding}
                class="h-8 text-xs flex-1"
                required
              />

              <Select.Root
                type="single"
                value={inviteRole}
                onValueChange={(val: string) => {
                  if (val) inviteRole = val as GuestRole;
                }}
              >
                <Select.Trigger size="sm" class="w-28 h-8 text-xs shrink-0">
                  {roleDescriptions[inviteRole].label}
                </Select.Trigger>
                <Select.Content>
                  <Select.Group>
                    <Select.GroupHeading>Role</Select.GroupHeading>
                    <Select.Item value="viewer" label="Viewer" />
                    <Select.Item value="comment" label="Commenter" />
                    <Select.Item value="editor" label="Editor" />
                    <Select.Item value="admin" label="Admin" />
                  </Select.Group>
                </Select.Content>
              </Select.Root>

              <Button
                type="submit"
                size="sm"
                disabled={guestsStore.isAdding || !inviteEmail}
                class="h-8 px-3 text-xs shrink-0 gap-1.5"
              >
                {#if guestsStore.isAdding}
                  <BarSpinner class="size-3.5" />
                {:else}
                  <UserPlus class="size-3.5" />
                {/if}
                Invite
              </Button>
            </div>

            <!-- Role description / info badge -->
            <div
              class="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground flex items-start gap-2 border"
            >
              <Info class="size-3.5 text-primary mt-0.5 shrink-0" />
              <div class="leading-tight">
                <span class="font-medium text-foreground">
                  {roleDescriptions[inviteRole].label}:
                </span>{" "}
                {roleDescriptions[inviteRole].description}
              </div>
            </div>
          </form>

          <Separator class="my-2" />
        {/if}

        <!-- Members list -->
        <div class="space-y-2">
          <div
            class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            People with access
          </div>

          <div class="max-h-56 overflow-y-auto space-y-2 pr-1 ">
            {#if guestsStore.isLoading && !guestsStore.owner && guestsStore.guests.length === 0}
              <div class="flex items-center justify-center py-6">
                <BarSpinner class="size-5 text-muted-foreground" />
              </div>
            {:else}
              <!-- Owner row -->
              {#if guestsStore.owner}
                <div
                  class="flex items-center justify-between py-1 px-1 rounded-md hover:bg-muted/30"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <Avatar class="size-7 text-xs">
                      {#if guestsStore.owner.image}
                        <AvatarImage
                          src={guestsStore.owner.image}
                          alt={guestsStore.owner.name}
                        />
                      {/if}
                      <AvatarFallback
                        >{getInitials(guestsStore.owner.name)}</AvatarFallback
                      >
                    </Avatar>
                    <div class="min-w-0 flex flex-col">
                      <div
                        class="text-xs font-medium truncate flex items-center gap-1.5"
                      >
                        {guestsStore.owner.name}
                        {#if currentUser && guestsStore.owner.id === currentUser.id}
                          <span class="text-[10px] text-muted-foreground"
                            >(You)</span
                          >
                        {/if}
                      </div>
                      <div class="text-[11px] text-muted-foreground truncate">
                        {guestsStore.owner.email}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    class="text-[10px] font-normal px-2 py-0.5"
                  >
                    Owner
                  </Badge>
                </div>
              {/if}

              <!-- Guests list -->
              {#each guestsStore.guests as guest (guest.id)}
                <div
                  class="flex items-center justify-between py-1 px-1 rounded-md hover:bg-muted/30"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <Avatar class="size-7 text-xs">
                      {#if guest.user.image}
                        <AvatarImage
                          src={guest.user.image}
                          alt={guest.user.name}
                        />
                      {/if}
                      <AvatarFallback
                        >{getInitials(guest.user.name)}</AvatarFallback
                      >
                    </Avatar>
                    <div class="min-w-0 flex flex-col">
                      <div
                        class="text-xs font-medium truncate flex items-center gap-1.5"
                      >
                        {guest.user.name}
                        {#if currentUser && guest.userId === currentUser.id}
                          <span class="text-[10px] text-muted-foreground"
                            >(You)</span
                          >
                        {/if}
                      </div>
                      <div class="text-[11px] text-muted-foreground truncate">
                        {guest.user.email}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    {#if updatingUserId === guest.userId}
                      <div class="p-1">
                        <BarSpinner class="size-3.5 text-muted-foreground" />
                      </div>
                    {:else if canManage && (!currentUser || currentUser.id !== guest.userId)}
                      <Select.Root
                        type="single"
                        value={guest.role}
                        onValueChange={(val: string) => {
                          if (val && val !== guest.role) {
                            handleUpdateRole(guest.userId, val as GuestRole);
                          }
                        }}
                      >
                        <Select.Trigger
                          size="sm"
                          class="h-7 text-[11px] px-2 w-24"
                        >
                          {roleDescriptions[guest.role].label}
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Group>
                            <Select.GroupHeading>Role</Select.GroupHeading>
                            <Select.Item value="viewer" label="Viewer" />
                            <Select.Item value="comment" label="Commenter" />
                            <Select.Item value="editor" label="Editor" />
                            <Select.Item value="admin" label="Admin" />
                          </Select.Group>
                        </Select.Content>
                      </Select.Root>

                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove guest"
                        onclick={() =>
                          handleRemoveGuest(guest.userId, guest.user.email)}
                      >
                        <Trash2 class="size-3.5" />
                      </Button>
                    {:else}
                      <Badge
                        variant="outline"
                        class="text-[10px] font-normal px-2 py-0.5"
                      >
                        {roleDescriptions[guest.role].label}
                      </Badge>
                    {/if}
                  </div>
                </div>
              {/each}

              {#if guestsStore.guests.length === 0}
                <div class="text-center py-4 text-xs text-muted-foreground">
                  No other members have access to this note yet.
                </div>
              {/if}
            {/if}
          </div>
        </div>
      </TabsContent>

      <!-- PUBLISH TAB (Placeholder) -->
      <TabsContent
        value="publish"
        class="pt-3 space-y-4 focus-visible:outline-none"
      >
        <div class="rounded-lg border bg-card p-3.5 space-y-3">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <Globe class="size-4" />
            </div>
            <div class="space-y-1 min-w-0">
              <h4 class="text-xs font-medium text-foreground">
                Publish to the web
              </h4>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Make this note publicly accessible via a shareable public link.
                Anyone with the link will be able to view it.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <Input
              readonly
              value={`https://nota.ink/p/${noteId}`}
              class="h-8 text-xs bg-muted/40 font-mono select-all flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              class="h-8 px-3 text-xs gap-1.5 shrink-0"
              onclick={handleCopyLink}
            >
              {#if copied}
                <Check class="size-3.5 text-green-500" />
                Copied
              {:else}
                <Copy class="size-3.5" />
                Copy
              {/if}
            </Button>
          </div>
        </div>

        <div
          class="flex items-center justify-between text-xs text-muted-foreground px-1"
        >
          <span>Web indexing & search engines</span>
          <Badge variant="outline" class="text-[10px] font-normal"
            >Coming soon</Badge
          >
        </div>
      </TabsContent>
    </Tabs>
  </PopoverContent>
</Popover>
