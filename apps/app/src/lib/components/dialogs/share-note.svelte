<script lang="ts">
import AlertCircle from "@lucide/svelte/icons/alert-circle";
import Check from "@lucide/svelte/icons/check";
import Copy from "@lucide/svelte/icons/copy";
import ExternalLink from "@lucide/svelte/icons/external-link";
import Globe from "@lucide/svelte/icons/globe";
import Info from "@lucide/svelte/icons/info";
import RefreshCw from "@lucide/svelte/icons/refresh-cw";
import Sparkles from "@lucide/svelte/icons/sparkles";
import Trash2 from "@lucide/svelte/icons/trash-2";
import UserPlus from "@lucide/svelte/icons/user-plus";
import Users from "@lucide/svelte/icons/users";
import type { PublishMeta } from "@nota/db/data/publish";
import type { GuestRole } from "@nota/db/types";
import { toast } from "@nota/ui";
import type { Editor } from "@nota/ui/edra/tiptap/index.js";
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
import { openUrl } from "@tauri-apps/plugin-opener";
import { slide } from "svelte/transition";
import { getAuthSession, getUserQuota } from "#lib/auth-session.svelte.ts";
import { CloudGuests } from "#lib/data/cloud/guests.svelte.ts";
import type { NoteMeta } from "#lib/data/types.js";
import { client } from "#lib/orpc.ts";
import { formatDate, ISDESKTOP } from "#lib/utils.ts";
import { PUBLIC_NOTA_URL } from "$app/env/public";

let {
	noteId,
	note,
	editor,
	class: className,
}: {
	noteId: string;
	note?: NoteMeta | null;
	editor?: Editor | null;
	class?: string;
} = $props();

const session = getAuthSession();
const currentUser = $derived(session.data?.user);
const userQuota = getUserQuota();
const isPro = $derived(userQuota.data?.planTier === "pro");

const guestsStore = new CloudGuests(noteId);

$effect(() => {
	guestsStore.noteId = noteId;
});

let open = $state(false);
let inviteEmail = $state("");
let inviteRole = $state<GuestRole>("editor");
let updatingUserId = $state<string | null>(null);
let copied = $state(false);

// Publish state
let publishMeta = $state<PublishMeta | null>(null);
let isLoadingPublishMeta = $state(false);
let isSubmitting = $state(false);
let customSlug = $state("");
let isEditingSlug = $state(false);
let publishError = $state<string | null>(null);

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
	Boolean(
		currentUser &&
			(guestsStore.owner?.id === currentUser.id ||
				(note && "ownerId" in note && note.ownerId === currentUser.id)),
	),
);

const currentGuestRole = $derived(
	currentUser
		? guestsStore.guests.find((g) => g.userId === currentUser.id)?.role
		: undefined,
);

const canManage = $derived(isOwner || currentGuestRole === "admin");

const isPublished = $derived(
	Boolean(publishMeta && publishMeta.status === "published"),
);

const isOutOfSync = $derived(
	Boolean(
		isPublished &&
			note?.updatedAt &&
			publishMeta?.updatedAt &&
			new Date(note.updatedAt).getTime() >
				new Date(publishMeta.updatedAt).getTime() + 1000,
	),
);

const publicUrl = $derived(
	publishMeta?.slug
		? `${PUBLIC_NOTA_URL}/p/${publishMeta.slug}`
		: `${PUBLIC_NOTA_URL}/p/${noteId}`,
);

const fetchPublishMeta = async () => {
	isLoadingPublishMeta = true;
	try {
		const meta = await client.publish.getMeta({ noteId });
		publishMeta = meta;
		if (meta?.slug) {
			customSlug = meta.slug;
		}
	} catch (e) {
		console.error("Failed to fetch publish meta:", e);
	} finally {
		isLoadingPublishMeta = false;
	}
};

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
	navigator.clipboard.writeText(publicUrl);
	copied = true;
	toast.success("Link copied to clipboard");
	setTimeout(() => {
		copied = false;
	}, 2000);
};

const handleOpenLink = () => {
	if (ISDESKTOP) {
		openUrl(publicUrl);
	} else {
		window.open(publicUrl, "_blank");
	}
};

const handlePublish = async () => {
	if (!editor) {
		toast.error("Editor is not ready yet.");
		return;
	}
	isSubmitting = true;
	publishError = null;
	try {
		const html = editor.getHTML();
		const result = await client.publish.create({
			noteId,
			slug: customSlug.trim() || undefined,
			title: note?.name,
			contentHtml: html,
		});
		publishMeta = result;
		customSlug = result.slug;
		toast.success("Note published to the web!");
	} catch (err: any) {
		const msg = err?.message || "Failed to publish note";
		publishError = msg;
		toast.error(msg);
	} finally {
		isSubmitting = false;
	}
};

const handleUpdateContent = async () => {
	if (!editor) {
		toast.error("Editor is not ready yet.");
		return;
	}
	isSubmitting = true;
	publishError = null;
	try {
		const html = editor.getHTML();
		const result = await client.publish.update({
			noteId,
			title: note?.name,
			contentHtml: html,
		});
		if (result) {
			publishMeta = result;
		}
		toast.success("Published version updated!");
	} catch (err: any) {
		const msg = err?.message || "Failed to update published note";
		publishError = msg;
		toast.error(msg);
	} finally {
		isSubmitting = false;
	}
};

const handleSaveSlug = async () => {
	if (!customSlug.trim()) {
		publishError = "Slug cannot be empty";
		return;
	}
	isSubmitting = true;
	publishError = null;
	try {
		const result = await client.publish.update({
			noteId,
			slug: customSlug.trim(),
		});
		if (result) {
			publishMeta = result;
			isEditingSlug = false;
			toast.success("Slug updated successfully!");
		}
	} catch (err: any) {
		const msg = err?.message || "Failed to update slug";
		publishError = msg;
		toast.error(msg);
	} finally {
		isSubmitting = false;
	}
};

const handleUnpublish = async () => {
	isSubmitting = true;
	publishError = null;
	try {
		await client.publish.delete({ noteId });
		publishMeta = null;
		customSlug = "";
		isEditingSlug = false;
		toast.success("Note unpublished");
	} catch (err: any) {
		const msg = err?.message || "Failed to unpublish note";
		publishError = msg;
		toast.error(msg);
	} finally {
		isSubmitting = false;
	}
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
      fetchPublishMeta();
    }
  }}
>
  <PopoverTrigger>
    <Button
      variant="ghost"
      class="text-muted-foreground font-medium text-xs {className}"
    >
      <Users />
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
          <Users class="size-3.5" />
          Manage Guests
        </TabsTrigger>
        <TabsTrigger value="publish" class="text-xs gap-1.5" onclick={fetchPublishMeta}>
          <Globe class="size-3.5" />
          Publish Note
        </TabsTrigger>
      </TabsList>

      <!-- MANAGE GUESTS TAB -->
      <TabsContent
        value="guests"
        class="pt-3 space-y-4 focus-visible:outline-none"
      >
        <!-- Warning that storage is charged to owner -->
        <div
          class="rounded-lg bg-muted/40 border p-2.5 text-xs text-muted-foreground flex items-start gap-2"
        >
          <Info class="size-3.5 text-primary mt-0.5 shrink-0" />
          <div class="leading-tight">
            Storage consumed by collaborators, attachments, and snapshots is billed directly to the owner of this note.
          </div>
        </div>

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

          <div class="max-h-56 overflow-y-auto space-y-2 pr-1">
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

      <!-- PUBLISH TAB -->
      <TabsContent
        value="publish"
        class="pt-3 space-y-3.5 focus-visible:outline-none"
      >
        {#if isLoadingPublishMeta}
          <div class="flex items-center justify-center py-8">
            <BarSpinner class="size-5 text-muted-foreground" />
          </div>
        {:else if !isOwner}
          <!-- Only Owner Can Publish -->
          <div class="rounded-lg border bg-muted/20 p-4 text-center space-y-2">
            <div class="p-2 rounded-full bg-muted w-fit mx-auto text-muted-foreground">
              <Globe class="size-5" />
            </div>
            <div class="text-xs font-semibold">Owner Permission Required</div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Only the owner of this note can manage public sharing and publish settings.
            </p>
          </div>
        {:else if !isPro}
          <!-- Pro Gate Screen for Free Users -->
          <div class="rounded-lg border bg-gradient-to-b from-primary/5 via-card to-card p-4 space-y-3">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles class="size-4" />
              </div>
              <div>
                <h4 class="text-xs font-semibold">Publishing is a Pro Feature</h4>
                <p class="text-[11px] text-muted-foreground">
                  Share this note publicly on the web with custom links
                </p>
              </div>
            </div>

            <div class="text-[11px] text-muted-foreground space-y-1.5 pl-1">
              <div class="flex items-center gap-1.5">
                <Check class="size-3 text-primary shrink-0" />
                <span>Custom URL slugs & instant publishing</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Check class="size-3 text-primary shrink-0" />
                <span>Search engine indexing controls</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Check class="size-3 text-primary shrink-0" />
                <span>Clean public reader view for anyone</span>
              </div>
            </div>

            <Button
              class="w-full h-8 text-xs gap-1.5"
              onclick={() => {
                const url = `${PUBLIC_NOTA_URL}/pricing`;
                if (ISDESKTOP) {
                  openUrl(url);
                } else {
                  window.open(url, "_blank");
                }
              }}
            >
              <Sparkles class="size-3.5" />
              Upgrade to Pro
            </Button>
          </div>
        {:else if !isPublished}
          <!-- Default: Not Published State -->
          <div class="rounded-lg border bg-card p-3.5 space-y-3.5">
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Globe class="size-4" />
              </div>
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-medium text-foreground">
                    Publish to the web
                  </h4>
                  <Badge variant="outline" class="text-[10px] py-0 px-1.5 text-muted-foreground font-normal">
                    Not published
                  </Badge>
                </div>
                <p class="text-[11px] text-muted-foreground leading-relaxed">
                  Make this note publicly accessible via a shareable public link.
                  Anyone with the link will be able to view it.
                </p>
              </div>
            </div>

            <div class="space-y-1.5 pt-1 border-t">
              <label for="custom-slug-input" class="text-[11px] font-medium text-muted-foreground block">
                Custom URL Slug (optional)
              </label>
              <div class="flex items-center rounded-md border bg-muted/30 px-2.5 py-1 focus-within:ring-1 focus-within:ring-ring">
                <span class="text-xs text-muted-foreground font-mono select-none">/p/</span>
                <input
                  id="custom-slug-input"
                  bind:value={customSlug}
                  placeholder="my-custom-slug"
                  class="flex-1 bg-transparent text-xs font-mono outline-none px-1 placeholder:text-muted-foreground/50"
                />
              </div>
              <p class="text-[10px] text-muted-foreground">
                Leave blank to auto-generate a unique 15-character slug.
              </p>
            </div>

            {#if publishError}
              <div class="text-[11px] text-destructive flex items-center gap-1.5">
                <AlertCircle class="size-3.5 shrink-0" />
                <span>{publishError}</span>
              </div>
            {/if}

            <Button
              class="w-full h-8 text-xs gap-1.5"
              disabled={isSubmitting}
              onclick={handlePublish}
            >
              {#if isSubmitting}
                <BarSpinner class="size-3.5" />
                Publishing...
              {:else}
                <Globe class="size-3.5" />
                Publish Note
              {/if}
            </Button>
          </div>
        {:else}
          <!-- Published State -->
          {#if isOutOfSync}
            <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <div class="flex items-start gap-2">
                <AlertCircle class="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div class="leading-tight space-y-0.5">
                  <span class="font-medium">Unpublished changes</span>
                  <p class="text-[11px] opacity-90">
                    You have made edits since this note was last published. Update now to sync changes.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                class="w-full h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                disabled={isSubmitting}
                onclick={handleUpdateContent}
              >
                {#if isSubmitting}
                  <BarSpinner class="size-3 text-white" />
                {:else}
                  <RefreshCw class="size-3" />
                {/if}
                Update Published Version
              </Button>
            </div>
          {/if}

          <div class="rounded-lg border bg-card p-3.5 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                  <Globe class="size-4" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-xs font-medium">Public link is active</h4>
                    <Badge class="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-1.5 font-normal">
                      Live
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Public URL display & Copy -->
            <div class="flex items-center gap-1.5">
              <Input
                readonly
                value={publicUrl}
                class="h-8 text-xs bg-muted/40 font-mono select-all flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                class="h-8 px-2.5 text-xs gap-1 shrink-0"
                onclick={handleCopyLink}
              >
                {#if copied}
                  <Check class="size-3.5 text-green-500" />
                {:else}
                  <Copy class="size-3.5" />
                {/if}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8 shrink-0"
                title="Open public note"
                onclick={handleOpenLink}
              >
                <ExternalLink class="size-3.5" />
              </Button>
            </div>

            <!-- Edit Slug Section -->
            <div class="space-y-1.5 pt-2 border-t text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-muted-foreground">URL Slug:</span>
                {#if !isEditingSlug}
                  <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => {
                      customSlug = publishMeta?.slug || "";
                      isEditingSlug = true;
                    }}
                  >
                    Change slug
                  </Button>
                {/if}
              </div>

              {#if isEditingSlug}
                <div transition:slide class="space-y-2">
                  <div class="flex items-center rounded-md border bg-muted/30 px-2 py-1 focus-within:ring-1 focus-within:ring-ring">
                    <span class="text-xs text-muted-foreground font-mono select-none">/p/</span>
                    <input
                      bind:value={customSlug}
                      placeholder="custom-slug"
                      class="flex-1 bg-transparent text-xs font-mono outline-none px-1"
                    />
                  </div>
                  {#if publishError}
                    <div class="text-[10px] text-destructive flex items-center gap-1">
                      <AlertCircle class="size-3 shrink-0" />
                      <span>{publishError}</span>
                    </div>
                  {/if}
                  <div class="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => {
                        isEditingSlug = false;
                        publishError = null;
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={isSubmitting || !customSlug.trim() || customSlug.trim() === publishMeta?.slug}
                      onclick={handleSaveSlug}
                    >
                      Save Slug
                    </Button>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Metadata info -->
            <div class="pt-2 border-t text-[11px] text-muted-foreground space-y-1">
              <div class="flex items-center justify-between">
                <span>Published on:</span>
                <span class="text-foreground">{formatDate(publishMeta?.publishedAt)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Last updated:</span>
                <span class="text-foreground">{formatDate(publishMeta?.updatedAt)}</span>
              </div>
            </div>

            <!-- Actions: Sync now & Unpublish -->
            <div class="flex items-center justify-between pt-2 border-t">
              <Button
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
                onclick={handleUnpublish}
              >
                <Trash2 />
                Unpublish
              </Button>

              {#if !isOutOfSync}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onclick={handleUpdateContent}
                >
                  {#if isSubmitting}
                    <BarSpinner size={14} />
                  {:else}
                    <RefreshCw />
                  {/if}
                  Sync latest
                </Button>
              {/if}
            </div>
          </div>
        {/if}
      </TabsContent>
    </Tabs>
  </PopoverContent>
</Popover>
