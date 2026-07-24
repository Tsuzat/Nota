<script lang="ts">
import { icons } from '@nota/ui/icons/index.js';
import * as Dialog from '@nota/ui/shadcn/dialog';
import * as Sidebar from '@nota/ui/shadcn/sidebar';
import Account from './components/account.svelte';
import AI from './components/ai.svelte';
import Appearance from './components/appearance.svelte';
import Editor from './components/editor.svelte';
import { getGlobalSettings } from './constants.svelte';

const useSettings = getGlobalSettings();

const nav = [
  { name: 'Account', icon: icons.User, component: Account },
  { name: 'Editor', icon: icons.Pen, component: Editor },
  { name: 'AI', icon: icons.Sparkles, component: AI },
  { name: 'Appearance', icon: icons.Paintbrush, component: Appearance },
];

let activeTab = $state(nav[0]);

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
    class="overflow-hidden p-0 md:max-h-125 md:max-w-175 lg:max-w-200"
    trapFocus={false}
  >
    <Dialog.Title class="sr-only">Settings</Dialog.Title>
    <Dialog.Description class="sr-only">Customize your settings here.</Dialog.Description>
    <Sidebar.Provider class="items-start h-full">
      <Sidebar.Root collapsible="none" class="hidden md:flex h-full">
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each nav as item (item.name)}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={activeTab.name === item.name}
                      onclick={() => activeTab = item}
                    >
                        {@const Icon = item.icon}
                          <Icon />
                          <span>{item.name}</span>
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                {/each}
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar.Root>
      <main class="flex h-120 flex-1 flex-col overflow-hidden">
        <header
          class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b"
        >
          <div class="flex items-center gap-2 px-6 w-full h-full">
             <span class="font-semibold text-lg">{activeTab.name}</span>
          </div>
        </header>
        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-6 pt-6">
          <activeTab.component />
        </div>
      </main>
    </Sidebar.Provider>
  </Dialog.Content>
</Dialog.Root>
