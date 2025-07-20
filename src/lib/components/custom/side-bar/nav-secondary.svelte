<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getLocalNotes } from '$lib/local/notes.svelte';
	import { Settings, Trash2 } from '@lucide/svelte';
	import Trashed from '../dialogs/trashed.svelte';

	const trashedNotes = $derived(
		getLocalNotes()
			.getNotes()
			.filter((n) => n.trashed).length
	);

	let open = $state(false);
</script>

<Sidebar.Group class="mt-auto">
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="group/settings">
					<Settings
						class="rotate-0 transition-transform duration-700 group-hover/settings:rotate-180"
					/>
					<span>Settings</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="group/trash" onclick={() => (open = true)}>
					<Trash2 class="group-hover/trash:animate-bounce" />
					<span>Trash</span>
				</Sidebar.MenuButton>
				<Sidebar.MenuBadge class="bg-muted text-muted-foreground rounded-full p-1.5">
					{trashedNotes}
				</Sidebar.MenuBadge>
				<Trashed bind:open />
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
