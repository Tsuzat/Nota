<script lang="ts">
import { icons } from '@nota/ui/icons/index.js';
import * as Dialog from '@nota/ui/shadcn/dialog';
import * as Tabs from '@nota/ui/shadcn/tabs';
import Account from './components/account.svelte';
import AI from './components/ai.svelte';
import Appearance from './components/appearance.svelte';
import Editor from './components/editor.svelte';
import { getGlobalSettings } from './constants.svelte';

const useSettings = getGlobalSettings();

const nav = [
  { value: 'account', name: 'Account', icon: icons.User, component: Account },
  { value: 'editor', name: 'Editor', icon: icons.Pen, component: Editor },
  { value: 'ai', name: 'AI', icon: icons.Sparkles, component: AI },
  { value: 'appearance', name: 'Appearance', icon: icons.Paintbrush, component: Appearance },
];

let activeTab = $state('account');

function handleKeydown(e: KeyboardEvent) {
  if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    useSettings.open = !useSettings.open;
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

<Dialog.Root bind:open={useSettings.open}>
  <Dialog.Trigger class="sr-only">Open Settings</Dialog.Trigger>
  <Dialog.Content
    class="overflow-hidden bg-popover/75 backdrop-blur-2xl p-0 md:max-h-145 md:max-w-195 lg:max-w-210 rounded-2xl shadow-2xl border flex flex-col"
  >
    <Dialog.Title class="sr-only">Settings</Dialog.Title>
    <Dialog.Description class="sr-only">Customize your Nota application settings.</Dialog.Description>

    <Tabs.Root value={activeTab} class="flex h-140 w-full flex-col overflow-hidden">
      <header class="flex h-14 shrink-0 items-center justify-between px-6 pr-14 backdrop-blur-md sticky top-0">
        <div class="flex items-center justify-center flex-1 mx-4">
          <Tabs.List>
            {#each nav as item (item.value)}
              {@const Icon = item.icon}
              <Tabs.Trigger
                value={item.value}
              >
                <Icon class="size-3.5" />
                <span>{item.name}</span>
              </Tabs.Trigger>
            {/each}
          </Tabs.List>
        </div>
      </header>
      <main class="flex flex-1 flex-col overflow-y-auto p-7 pr-10 pb-12">
        {#each nav as item (item.value)}
          <Tabs.Content value={item.value} class="m-0 focus-visible:outline-none">
            <item.component />
          </Tabs.Content>
        {/each}
      </main>
    </Tabs.Root>
    
  </Dialog.Content>
</Dialog.Root>
