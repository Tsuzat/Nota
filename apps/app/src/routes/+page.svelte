<script lang="ts">
import Cloud from "@lucide/svelte/icons/cloud";
import FilePlus from "@lucide/svelte/icons/file-plus";
import FolderPlus from "@lucide/svelte/icons/folder-plus";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import Settings from "@lucide/svelte/icons/settings";
import Star from "@lucide/svelte/icons/star";
import Trash2 from "@lucide/svelte/icons/trash-2";
import { toast } from "@nota/ui";
import { openDeleteConfirmation } from "@nota/ui/custom/dialogs/confirm-delete.svelte";
import { IconsRenderer } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.ts";
import * as Tooltip from "@nota/ui/shadcn/tooltip/index.ts";
import { cn } from "@nota/ui/utils";
import { getAuthSession } from "#lib/auth-session.svelte.ts";
import { Topbar } from "#lib/components/custom/index.ts";
import {
	getGlobalSettings,
	openCreateNotes,
	openCreateWorkspace,
} from "#lib/components/dialogs/index.ts";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import type { NoteMeta, Workspace } from "#lib/data/types.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { formatDate, ISDESKTOP } from "#lib/utils.ts";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

const workspaceCtx = getWorkspaceContext();
const noteCtx = getNotesContext();
const session = getAuthSession();
const useSettings = getGlobalSettings();

const user = $derived(session.user);
const displayName = $derived(
	user?.name || user?.email?.split("@")[0] || "there",
);

const greeting = $derived.by(() => {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
});

const today = new Date().toLocaleDateString(undefined, {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
});

// Desktop shows local + cloud workspaces; web only has cloud ones.
const workspaces = $derived(
	ISDESKTOP ? workspaceCtx.all : workspaceCtx.cloud.workspaces,
);

const noteUpdatedAt = (value: unknown) =>
	typeof value === "number"
		? value * 1000
		: new Date(value as string).getTime();

// Recent notes of the current workspace.
const recentNotes = $derived(
	[...noteCtx.list]
		.filter((n) => !n.trashedAt)
		.sort((a, b) => noteUpdatedAt(b.updatedAt) - noteUpdatedAt(a.updatedAt))
		.slice(0, 8),
);

const noteHref = (note: NoteMeta) =>
	"ownerId" in note
		? resolve("/(cloud)/note-[id]", { id: note.id })
		: resolve("/(local)/local-note-[id]", { id: note.id });

const openWorkspace = (workspace: Workspace) => {
	workspaceCtx.current = workspace;
	goto(
		resolve(
			"ownerId" in workspace
				? "/(cloud)/space-[id]"
				: "/(local)/local-workspace-[id]",
			{ id: workspace.id },
		),
	);
};

/**
 * Returns why a workspace can't be deleted (rule 2 & 3), or null if it can.
 */
const workspaceDeleteBlockReason = (workspace: Workspace): string | null => {
	if (workspace.id === workspaceCtx.current?.id) {
		return "Switch to another workspace before deleting this one";
	}
	const isCloud = "ownerId" in workspace;
	const list = isCloud
		? workspaceCtx.cloud.workspaces
		: workspaceCtx.local.workspaces;
	return list.length <= 1
		? `You need at least one ${isCloud ? "cloud" : "local"} workspace. Create another one to delete this.`
		: null;
};

const confirmDeleteWorkspace = (workspace: Workspace) => {
	openDeleteConfirmation({
		title: `Delete "${workspace.name}"?`,
		description:
			"This will permanently delete the workspace and all of its notes.",
		confirmation: { text: workspace.name },
		warning: { allowDelete: true, text: "This action cannot be undone." },
		onClick: async () => {
			if ("ownerId" in workspace) {
				await workspaceCtx.cloud.delete(workspace.id);
			} else {
				await workspaceCtx.local.delete(workspace.id);
			}
			toast.success(`Workspace "${workspace.name}" deleted`);
		},
	});
};

const confirmDeleteNote = (note: NoteMeta) => {
	openDeleteConfirmation({
		title: `Delete "${note.name}"?`,
		description: "This note will be deleted permanently.",
		confirmation: { text: note.name },
		warning: { allowDelete: true, text: "This cannot be undone." },
		onClick: async () => {
			await noteCtx.delete(note.id);
		},
	});
};

const toggleStar = (note: NoteMeta) => {
	noteCtx
		.updateMeta(note.id, { starred: !note.starred })
		.catch(() => toast.error("Failed to update favorite status"));
};
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <Topbar class="shrink-0" />
  <div class="min-h-0 max-h-[calc(100vh-4rem)] flex-1 overflow-y-auto ">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
	<!-- Greeting & Header -->
	<header class="flex flex-col gap-4 border-b border-border/40 pb-6">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
				{greeting}, {displayName}
			</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">{today}</p>
		</div>

		<!-- Quick actions -->
		<div class="flex flex-wrap gap-2 pt-1">
			<Button variant="outline" size="sm" onclick={() => openCreateNotes()}>
				<FilePlus data-icon="inline-start" />
				New Note
			</Button>
			<Button variant="outline" size="sm" onclick={openCreateWorkspace}>
				<FolderPlus data-icon="inline-start" />
				New Workspace
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => (useSettings.open = true)}
			>
				<Settings data-icon="inline-start" />
				Settings
			</Button>
		</div>
	</header>

	<!-- Workspace delete button snippet -->
	{#snippet workspaceDeleteButton(workspace: Workspace)}
		{@const reason = workspaceDeleteBlockReason(workspace)}
		{#if reason}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<div {...props} class="inline-flex">
							<Button variant="ghost" size="icon-xs" disabled>
								<Trash2 />
								<span class="sr-only">Delete workspace</span>
							</Button>
						</div>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-48 text-balance text-center">
					{reason}
				</Tooltip.Content>
			</Tooltip.Root>
		{:else}
			<Button
				variant="ghost"
				size="icon-xs"
				onclick={(e) => {
					e.stopPropagation();
					confirmDeleteWorkspace(workspace);
				}}
				onkeydown={(e) => e.stopPropagation()}
			>
				<Trash2 />
				<span class="sr-only">Delete workspace</span>
			</Button>
		{/if}
	{/snippet}

	<!-- Workspaces Section -->
	<section class="flex flex-col gap-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-lg font-semibold">Workspaces</span>
				<Badge variant="outline" class="rounded-full size-6 text-xs">
					{workspaces.length}
				</Badge>
			</div>
		</div>

		{#if (!ISDESKTOP && workspaceCtx.cloud.isLoading && workspaces.length === 0)}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(3) as _}
					<div class="h-28 rounded-xl border border-border/50 bg-muted/20 animate-pulse p-4 flex flex-col justify-between">
						<div class="flex items-center gap-2">
							<div class="size-6 rounded-md bg-muted/60"></div>
							<div class="h-4 w-28 rounded bg-muted/60"></div>
						</div>
						<div class="h-3 w-16 rounded bg-muted/40 self-end"></div>
					</div>
				{/each}
			</div>
		{:else if workspaces.length === 0}
			<Card.Root class="mx-auto w-full max-w-md border-dashed">
				<Card.Header class="text-center">
					<div class="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
						<FolderPlus class="size-6" />
					</div>
					<Card.Title class="text-base font-semibold">No workspaces yet</Card.Title>
					<Card.Description>
						Create your first workspace to start taking notes.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex justify-center">
					<Button onclick={openCreateWorkspace}>
						<FolderPlus data-icon="inline-start" />
						Create Workspace
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each workspaces as workspace (workspace.id)}
					{@const isCloud = "ownerId" in workspace}
					{@const isCurrent = workspace.id === workspaceCtx.current?.id}
					<Card.Root
						role="button"
						tabindex={0}
						class={cn(
							"group/card relative cursor-pointer border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
							isCurrent ? "border-primary/60 ring-1 ring-muted-foreground" : "",
						)}
						onclick={() => openWorkspace(workspace)}
						onkeydown={(e) => e.key === "Enter" && openWorkspace(workspace)}
					>
						<div
							class="absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100"
						>
							{@render workspaceDeleteButton(workspace)}
						</div>
						<Card.Header class="pb-2">
							<Card.Title class="flex w-full items-center gap-2 text-sm font-medium">
								<IconsRenderer icon={workspace.icon ?? "lucide:Folder"} class="text-lg" />
								<span class="min-w-0 flex-1 truncate">{workspace.name}</span>
							</Card.Title>
							{#if workspace.description}
								<Card.Description class="line-clamp-2 text-xs">
									{workspace.description}
								</Card.Description>
							{/if}
						</Card.Header>
						<Card.Footer class="justify-end pt-0">
							{#if isCloud}
								<Badge variant="secondary" class="gap-1 text-[0.7rem]">
									<Cloud data-icon="inline-start" />
									Cloud
								</Badge>
							{:else}
								<Badge variant="secondary" class="gap-1 text-[0.7rem]">
									<HardDrive data-icon="inline-start" />
									Local
								</Badge>
							{/if}
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Recent Notes Section -->
	<section class="flex flex-col gap-3">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold tracking-tight">
				Recent Notes
				{#if workspaceCtx.current}
					<span class="font-normal text-muted-foreground">
						in {workspaceCtx.current.name}
					</span>
				{/if}
			</h2>
		</div>

		{#if (!ISDESKTOP && noteCtx.cloud.isLoading && recentNotes.length === 0)}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each Array(2) as _}
					<div class="h-16 rounded-xl border border-border/50 bg-muted/20 animate-pulse p-3 flex flex-col justify-center gap-2">
						<div class="h-4 w-36 rounded bg-muted/60"></div>
						<div class="h-3 w-24 rounded bg-muted/40"></div>
					</div>
				{/each}
			</div>
		{:else if recentNotes.length === 0}
			<p class="text-xs text-muted-foreground">
				No notes in this workspace yet.
			</p>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each recentNotes as note (note.id)}
					<div class="group/card relative">
						<a href={noteHref(note)} class="block rounded-xl">
							<Card.Root class="border-border/60 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
								<Card.Header class="pb-1 pr-16">
									<Card.Title class="flex w-full items-center gap-2 text-sm font-medium">
										<IconsRenderer icon={note.icon ?? "lucide:FileText"} class="size-4 shrink-0 text-muted-foreground transition-colors group-hover/card:text-foreground" />
										<span class="min-w-0 flex-1 truncate">{note.name}</span>
									</Card.Title>
									<Card.Description class="text-xs text-muted-foreground">
										Last updated {formatDate(note.updatedAt)}
									</Card.Description>
								</Card.Header>
							</Card.Root>
						</a>
						<div class="absolute top-2.5 right-2.5 z-10 flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon-xs"
								class={cn(
									"transition-opacity",
									note.starred
										? "opacity-100"
										: "opacity-0 group-focus-within/card:opacity-100 group-hover/card:opacity-100",
								)}
								onclick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									toggleStar(note);
								}}
								title={note.starred ? "Unstar note" : "Star note"}
							>
								<Star
									class={cn(
										"size-3.5",
										note.starred && "fill-amber-400 text-amber-400",
									)}
								/>
								<span class="sr-only">{note.starred ? "Unstar note" : "Star note"}</span>
							</Button>
							<Button
								variant="ghost"
								size="icon-xs"
								class="opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 text-muted-foreground hover:text-destructive"
								onclick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									confirmDeleteNote(note);
								}}
							>
								<Trash2 class="size-3.5" />
								<span class="sr-only">Delete note</span>
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
    </div>
  </div>
</div>
