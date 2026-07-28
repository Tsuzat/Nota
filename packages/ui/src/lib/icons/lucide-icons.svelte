<script lang="ts">
import { icons, Shuffle } from '@lucide/svelte';
import Search from '@lucide/svelte/icons/search';
import X from '@lucide/svelte/icons/x';
import { Button } from '@lib/components/ui/button';
import IconRenderer from './lucide-renderer.svelte';
import { Input } from '@lib/components/ui/input';
import Tooltip from '@lib/components/custom/SimpleToolTip.svelte';

const allLucideIcons = Object.keys(icons) as Array<keyof typeof icons>;

let iconNames = $state(allLucideIcons);

interface Props {
  onSelect?: (icon: string) => void;
}
let { onSelect }: Props = $props();

let loadedIcons = $state(150);
let searchTerm = $state('');

function updateSearch(searchTerm: string) {
  if (searchTerm.trim() === '') {
    iconNames = allLucideIcons;
    loadedIcons = 150;
  } else {
    iconNames = allLucideIcons.filter((iconName) => iconName.toLowerCase().includes(searchTerm.toLowerCase()));
    loadedIcons = Math.min(iconNames.length, 150);
  }
}

function onscroll() {
  loadedIcons = Math.min(iconNames.length, loadedIcons + 150);
}

let iconListDiv: HTMLDivElement | null = null;

function handleScroll() {
  if (!iconListDiv) return;
  const { scrollTop, scrollHeight, clientHeight } = iconListDiv;
  // Load more when scrolled within 50px of the bottom
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    onscroll();
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null;

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  searchTerm = value;
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    updateSearch(searchTerm);
  }, 300);
}

function getRandom() {
  throw new Error('Function not implemented.');
}
</script>

<div class="flex h-96 w-full flex-col gap-1">
  <div class="flex h-12 items-center relative gap-2 p-1">
    <div class="relative flex w-full items-center">
      <Input
        bind:value={searchTerm}
        placeholder="Search Icons..."
        class="pr-6 peer ps-10"
      />
      <span
        class="text-muted-foreground pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-sm peer-disabled:opacity-50"
      >
        <Search class="size-4" />
      </span>
      <Button
        variant="ghost"
        class="absolute right-2 size-4 p-0"
        onclick={() => (searchTerm = "")}
      >
        <Tooltip content="Clear Search">
          <X />
        </Tooltip>
      </Button>
    </div>
    <Tooltip content="Select Random">
      <Button
        variant="outline"
        class="size-9 p-2 text-xl"
        onclick={() => onSelect?.("lucide:" + getRandom())}
      >
        <Shuffle />
      </Button>
    </Tooltip>
  </div>
  <div
    class="grid w-full grid-cols-10 flex-wrap justify-between overflow-y-auto"
    bind:this={iconListDiv}
    onscroll={handleScroll}
  >
    {#each iconNames.slice(0, loadedIcons) as iconName, idx (idx)}
      <Tooltip content={iconName}>
        <Button
          variant="ghost"
          size="icon"
          onclick={() => {
            onSelect?.(`lucide:${iconName}`);
          }}
        >
          <IconRenderer icon={iconName} />
        </Button>
      </Tooltip>
    {/each}
  </div>
</div>
