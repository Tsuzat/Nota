<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Settings, Trash2 } from '@lucide/svelte';
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
				<Sidebar.MenuButton class="group/trash">
					<Trash2 class="group-hover/trash:animate-bounce" />
					<span>Trash</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
