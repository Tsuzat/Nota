<script lang="ts">
import * as Dialog from '@nota/ui/shadcn/dialog';
import { getGlobalSettings } from './constants.svelte';
import * as Tabs from '@nota/ui/shadcn/tabs';
import Account from './components/account.svelte';
import Editor from './components/editor.svelte';
import AI from './components/ai.svelte';
import Appearance from './components/appearance.svelte';
import { icons } from '@nota/ui/icons/index.js';

const useSettings = getGlobalSettings();

const nav = [
  { name: 'Account', icon: icons.User, component: Account },
  { name: 'Editor', icon: icons.Pen, component: Editor },
  { name: 'AI', icon: icons.Sparkles, component: AI },
  { name: 'Appearance', icon: icons.Paintbrush, component: Appearance },
];

function handleKeydown(e: KeyboardEvent) {
  if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    useSettings.open = !useSettings.open;
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

<Dialog.Root bind:open={useSettings.open}>
	<Dialog.Trigger class="sr-only">Open</Dialog.Trigger>
	<Dialog.Content
		class="overflow-hidden p-2 transition-all duration-500 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
		trapFocus={false}
		showCloseButton={false}
	>
		<Tabs.Root value="account">
			<Tabs.List class="mx-auto inline-flex items-center justify-between">
				{#each nav as item (item.name)}
					<Tabs.Trigger value={item.name.toLowerCase()}>
						<svelte:component this={item.icon} class="h-4 w-4" />
						<span>{item.name}</span>
					</Tabs.Trigger>
				{/each}
			</Tabs.List>

			{#each nav as item (item.name)}
				<Tabs.Content class="w-full" value={item.name.toLowerCase()}>
					<svelte:component this={item.component} />
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
