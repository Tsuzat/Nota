<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { type WorkSpaceDB } from '$lib/database/workspace';
	import { createNote, type NotesDB } from '$lib/database/notes';
	import { NOTES, WORKSPACES } from '$lib/contants';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import Iconpicker from '$lib/components/icons/iconpicker.svelte';
	import IconRender from '$lib/components/icons/icon-render.svelte';

	let title: string | undefined = $state<string>();
	let icon: string = $state('📃');

	interface Props {
		workspace?: WorkSpaceDB;
		open: boolean;
	}

	let { workspace = undefined, open = $bindable(false) }: Props = $props();

	const workspaces = $WORKSPACES;

	let defaultWorkspace: WorkSpaceDB = $state(workspace ?? workspaces[0]);

	async function handleSubmit() {
		if (!title) return;
		const notes = await createNote(icon, title, defaultWorkspace);
		if (notes === null) {
			toast.warning('Could not create note', {
				description: `Notes with title ${title} can not be created`
			});
			return;
		}
		NOTES.update((notes_) => [...notes_, notes]);

		toast.success('Note created', {
			description: `Note with title ${title} created successfully`
		});
		goto(`/${notes.id}`);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create New Notes</Dialog.Title>
			<Dialog.Description>Create a new notes on selected workspace.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="flex items-center gap-4">
				<Label for="name" class="text-right">Title</Label>
				<Input
					id="name"
					bind:value={title}
					placeholder="Enter Workspace Name..."
					class="col-span-3"
				/>
			</div>
			<div class="flex items-center gap-4">
				<Label for="name" class="text-right">Icon</Label>
				<Iconpicker onSelect={(icon_) => (icon = icon_)} side="right">
					<IconRender {icon} class="text-xl border rounded" />
				</Iconpicker>
			</div>
			<div class="flex items-center gap-4">
				<Label for="name" class="text-right">Workspace</Label>
				<Select.Root type="single">
					<Select.Trigger class="flex items-center">
						<span class="mr-2">
							{defaultWorkspace.icon}
							{defaultWorkspace.name}
						</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>Workspaces</Select.GroupHeading>
							{#each workspaces as workspace (workspace.id)}
								<Select.Item class="flex items-center" value={workspace.id} label={workspace.name}>
									<span class="mr-2">
										{workspace.icon}
									</span>
									<span>
										{workspace.name}
									</span>
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="text-sm text-muted-foreground">
				<span>Notes Path : {defaultWorkspace.path}</span>
			</div>
		</div>
		<Dialog.Footer>
			<Button type="submit" onclick={handleSubmit} disabled={!title}>Create</Button>
			<Button variant="outline">Cancel</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
