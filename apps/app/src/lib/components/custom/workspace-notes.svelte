<script lang="ts">
import Cloud from "@lucide/svelte/icons/cloud";
import Ellipsis from "@lucide/svelte/icons/ellipsis";
import FilePlus from "@lucide/svelte/icons/file-plus";
import Folder from "@lucide/svelte/icons/folder";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import Plus from "@lucide/svelte/icons/plus";
import Star from "@lucide/svelte/icons/star";
import Trash2 from "@lucide/svelte/icons/trash-2";
import { toast } from "@nota/ui";
import { openDeleteConfirmation } from "@nota/ui/custom/dialogs/confirm-delete.svelte";
import { IconPicker, IconsRenderer } from "@nota/ui/icons/index.js";
import { Badge } from "@nota/ui/shadcn/badge/index.ts";
import { Button } from "@nota/ui/shadcn/button/index.js";
import * as Card from "@nota/ui/shadcn/card/index.ts";
import * as DropdownMenu from "@nota/ui/shadcn/dropdown-menu/index.ts";
import { Skeleton } from "@nota/ui/shadcn/skeleton/index.js";
import * as Tooltip from "@nota/ui/shadcn/tooltip/index.ts";
import { cn } from "@nota/ui/utils";
import { onMount } from "svelte";
import { getNotesContext } from "#lib/data/notes.svelte.ts";
import type { NoteMeta, Workspace } from "#lib/data/types.ts";
import { getWorkspaceContext } from "#lib/data/workspace.svelte.ts";
import { formatDate } from "#lib/utils.ts";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { openCreateNotes, openTrash } from "../dialogs";

interface Props {
	id: string;
	isCloud?: boolean;
}

const { id, isCloud = false }: Props = $props();

const workspaceCtx = getWorkspaceContext();
const noteCtx = getNotesContext();

let ready = $state(false);
let notFound = $state(false);
let nameInput = $state("");

onMount(async () => {
	if (!isCloud) {
		// Local workspaces live in the on-device DB; make sure they are loaded.
		try {
			await workspaceCtx.init();
		} catch {
			// Fetch failures are already surfaced by DataProviders.
		}
	}
	ready = true;
});

const isLoading = $derived(!ready || (isCloud && workspaceCtx.cloud.isLoading));

const workspace = $derived.by(() => {
	const list: Workspace[] = isCloud
		? workspaceCtx.cloud.workspaces
		: workspaceCtx.local.workspaces;
	return list.find((w) => w.id === id) ?? null;
});

$effect(() => {
	if (isLoading) return;
	const ws = workspace;
	notFound = ws === null;
	if (ws) {
		workspaceCtx.current = ws;
		nameInput = ws.name;
	}
});

const notes = $derived(noteCtx.list.filter((n) => !n.trashedAt));
const notesLoading = $derived(isCloud && noteCtx.cloud.isLoading);

const noteHref = (noteId: string) =>
	isCloud
		? resolve("/(cloud)/note-[id]", { id: noteId })
		: resolve("/(local)/local-note-[id]", { id: noteId });

async function renameWorkspace(name: string) {
	const ws = workspace;
	const trimmed = name.trim();
	if (!ws || !trimmed || trimmed === ws.name) return;
	try {
		if ("ownerId" in ws) {
			await workspaceCtx.cloud.update({
				id: ws.id,
				ownerId: ws.ownerId,
				name: trimmed,
			});
		} else {
			await workspaceCtx.local.update(ws.id, { name: trimmed });
		}
		toast.success("Workspace renamed");
	} catch {
		toast.error("Failed to rename workspace");
	}
}

async function updateWorkspaceIcon(icon: string) {
	const ws = workspace;
	if (!ws || ws.icon === icon) return;
	try {
		if ("ownerId" in ws) {
			await workspaceCtx.cloud.update({
				id: ws.id,
				ownerId: ws.ownerId,
				icon,
			});
		} else {
			await workspaceCtx.local.update(ws.id, { icon });
		}
		toast.success("Workspace icon updated");
	} catch {
		toast.error("Failed to update workspace icon");
	}
}

function handleNameBlur() {
	if (workspace && nameInput.trim() !== workspace.name) {
		renameWorkspace(nameInput);
	}
}

function handleNameKeydown(e: KeyboardEvent) {
	if (e.key === "Enter") {
		(e.currentTarget as HTMLInputElement).blur();
	}
}

function toggleStar(note: NoteMeta) {
	noteCtx
		.updateMeta(note.id, { starred: !note.starred })
		.catch(() => toast.error("Failed to update favorite status"));
}

function trashNote(note: NoteMeta) {
	openDeleteConfirmation({
		title: "Move to Bin?",
		description: `Do you want to move "${note.name}" to bin?`,
		confirmation: { text: note.name },
		warning: {
			allowDelete: true,
			text: `This note will be deleted permanently after 30 days, if not restored.`,
		},
		onClick: async () => {
			await noteCtx.updateMeta(note.id, { trashedAt: new Date() });
		},
		buttonText: "Move to Bin",
	});
}

function deleteNote(note: NoteMeta) {
	openDeleteConfirmation({
		title: `Delete "${note.name}"?`,
		description:
			"This note will be deleted permanently. Do you want to continue?",
		confirmation: { text: note.name },
		warning: {
			allowDelete: true,
			text: "This cannot be undone. We recommend moving it to the bin first.",
		},
		onClick: async () => {
			await noteCtx.delete(note.id);
		},
	});
}
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-4 pb-20 sm:px-6">
	{#if notFound}
		<Card.Root class="mx-auto mt-20 max-w-md text-center">
			<Card.Header>
				<div class="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
					<Folder class="size-6" />
				</div>
				<Card.Title>Workspace not found</Card.Title>
				<Card.Description>
					The workspace you are looking for does not exist or could not be
					loaded.
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex justify-center">
				<Button href="/">Go back to Home</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Workspace Header -->
		<div class="flex flex-col gap-4 border-b border-border/40 pb-6 pt-2">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="flex min-w-0 flex-1 items-start gap-4">
					{#if workspace}
						<div class="group/icon relative shrink-0">
							<IconPicker
								icon={workspace.icon ?? "lucide:folder"}
								onSelect={updateWorkspaceIcon}
								side="bottom"
							>
								<Button
									variant="outline"
									class="size-16 border-border/60 rounded-2xl"
									title="Change workspace icon"
								>
									<IconsRenderer icon={workspace.icon ?? "lucide:folder"} class="text-4xl!" />
								</Button>
							</IconPicker>
						</div>
						<div class="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
							<div class="flex items-center gap-2">
								<input
									type="text"
									class="w-full min-w-0 rounded-lg border border-transparent px-1.5 py-0.5 text-2xl font-bold tracking-tight text-foreground transition-colors hover:border-border/60 hover:bg-muted/40 focus:border-ring focus:outline-none sm:text-3xl"
									bind:value={nameInput}
									onblur={handleNameBlur}
									onkeydown={handleNameKeydown}
									placeholder="Workspace name"
									aria-label="Workspace name"
								/>
							</div>
							<div class="flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
								{#if isCloud}
									<Badge variant="secondary">
										<Cloud data-icon="inline-start" />
										Cloud
									</Badge>
								{:else}
									<Badge variant="secondary">
										<HardDrive data-icon="inline-start" />
										Local
									</Badge>
								{/if}
								<span class="inline-block size-1 rounded-full bg-muted-foreground/40"></span>
								<span>Last updated {formatDate(workspace.updatedAt)}</span>
							</div>
						</div>
					{:else}
						<Skeleton class="size-16 shrink-0 rounded-2xl" />
						<div class="flex min-w-0 flex-1 flex-col gap-2 pt-1">
							<Skeleton class="h-9 w-64 max-w-full" />
							<Skeleton class="h-4 w-40" />
						</div>
					{/if}
				</div>

				<div class="flex items-center gap-2 self-start pt-1">
					{#if !isLoading && !notesLoading}
						<Badge variant="outline" class="text-sm">
							{notes.length}
							{notes.length === 1 ? "note" : "notes"}
						</Badge>
					{/if}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="icon"
									disabled={!workspace || isLoading || notesLoading}
									onclick={openTrash}
								>
									<Trash2 />
									<span class="sr-only">Open trash</span>
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Trash / Bin</Tooltip.Content>
					</Tooltip.Root>
					<Button
						disabled={!workspace}
						onclick={() => openCreateNotes()}
					>
						<Plus data-icon="inline-start" />
						New Note
					</Button>
				</div>
			</div>
		</div>

		<!-- Notes Section -->
		<section class="flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold tracking-tight">Notes</h2>
			</div>

			{#if isLoading || notesLoading}
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each [1, 2, 3, 4, 5, 6] as skeleton (skeleton)}
						<Card.Root>
							<Card.Header>
								<Skeleton class="h-5 w-3/4" />
								<Skeleton class="h-4 w-full" />
							</Card.Header>
							<Card.Footer>
								<Skeleton class="h-4 w-32" />
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>
			{:else if notes.length === 0}
				<Card.Root class="mx-auto w-full max-w-md border-dashed">
					<Card.Header class="text-center">
						<div class="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
							<FilePlus class="size-6" />
						</div>
						<Card.Title class="text-base font-semibold">No notes yet</Card.Title>
						<Card.Description>
							Create your first note in this workspace to get started.
						</Card.Description>
					</Card.Header>
					<Card.Content class="flex justify-center">
						<Button onclick={() => openCreateNotes()}>
							<Plus data-icon="inline-start" />
							Create Note
						</Button>
					</Card.Content>
				</Card.Root>
			{:else}
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each notes as note (note.id)}
						<Card.Root
							role="button"
							tabindex={0}
							class="group/card relative cursor-pointer border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
							onclick={() => goto(noteHref(note.id))}
							onkeydown={(e) => e.key === "Enter" && goto(noteHref(note.id))}
						>
							<Card.Header class="pb-2">
								<Card.Title class="flex w-full items-center gap-2 text-sm font-medium">
									<IconsRenderer icon={note.icon ?? "lucide:FileText"} class="size-4 shrink-0 text-muted-foreground transition-colors group-hover/card:text-foreground" />
									<span class="min-w-0 flex-1 truncate">{note.name}</span>
								</Card.Title>
								{#if note.description}
									<Card.Description class="line-clamp-2 text-xs">
										{note.description}
									</Card.Description>
								{/if}
								<Card.Action class="flex items-center gap-0.5">
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
										<span class="sr-only">
											{note.starred ? "Unstar note" : "Star note"}
										</span>
									</Button>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger onclick={(e) => e.stopPropagation()}>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon-xs"
													class="opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100"
													onclick={(e) => e.stopPropagation()}
												>
													<Ellipsis class="size-3.5" />
													<span class="sr-only">Note actions</span>
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content
											class="w-48"
											align="end"
										>
											<DropdownMenu.Group>
												<DropdownMenu.Item
													variant="destructive"
													onclick={() => trashNote(note)}
												>
													<Trash2 data-icon="inline-start" />
													Move to Trash
												</DropdownMenu.Item>
												<DropdownMenu.Item
													variant="destructive"
													onclick={() => deleteNote(note)}
												>
													<Trash2 data-icon="inline-start" />
													Delete Permanently
												</DropdownMenu.Item>
											</DropdownMenu.Group>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Card.Action>
							</Card.Header>
							<Card.Footer class="pt-0 text-xs text-muted-foreground">
								Last updated {formatDate(note.updatedAt)}
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>
