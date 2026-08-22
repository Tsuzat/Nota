<script lang="ts">
import Search from "@lucide/svelte/icons/search";
import Shuffle from "@lucide/svelte/icons/shuffle";
import X from "@lucide/svelte/icons/x";
import { createVirtualizer } from "@tanstack/svelte-virtual";
import { onDestroy, onMount, untrack } from "svelte";
import SimpleTooltip from "../custom/simple-tooltip.svelte";
import { Button } from "../ui/button/index";
import { Input } from "../ui/input/index";
import LucideRenderer from "./lucide-renderer.svelte";
import { getLucideIcons } from "./utils";

interface Props {
	searchTerm?: string;
	onSelect?: (icon: string) => void;
}

let { searchTerm = $bindable(""), onSelect }: Props = $props();

let allIcons = $state<string[]>([]);
let debouncedSearchTerm = $state("");
let debounceTimeout: number | null = null;

onMount(async () => {
	allIcons = await getLucideIcons();
});

onDestroy(() => {
	if (debounceTimeout) clearTimeout(debounceTimeout);
});

function debounce(func: (value: string) => void, delay: number) {
	return (value: string) => {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = window.setTimeout(() => func(value), delay);
	};
}

const updateDebouncedSearch = debounce((value: string) => {
	debouncedSearchTerm = value;
}, 200);

$effect(() => {
	updateDebouncedSearch(searchTerm);
});

const filteredIcons = $derived(
	debouncedSearchTerm.trim() === ""
		? allIcons
		: allIcons.filter((name) =>
				name.toLowerCase().includes(debouncedSearchTerm.trim().toLowerCase()),
			),
);

function getRandom(): string {
	if (allIcons.length === 0) return "";
	const randomIndex = Math.floor(Math.random() * allIcons.length);
	return allIcons[randomIndex];
}

let scrollContainer = $state<HTMLElement | null>(null);
const COLUMNS = 10;
const ROW_HEIGHT = 40;

const virtualizerOptions = $derived({
	count: Math.ceil(filteredIcons.length / COLUMNS),
	getScrollElement: () => scrollContainer,
	estimateSize: () => ROW_HEIGHT,
	overscan: 5,
});

const virtualizer = createVirtualizer(virtualizerOptions);

$effect(() => {
	untrack(() => $virtualizer).setOptions(virtualizerOptions);
});
</script>

{#if allIcons.length === 0}
  <div
    class="flex h-96 w-full items-center justify-center text-sm text-muted-foreground"
  >
    Loading icons...
  </div>
{:else}
  <div class="flex h-96 w-full flex-col gap-1">
    <!-- Controls (Moved to Top) -->
    <div class="flex w-full items-center justify-between gap-2 p-1">
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
          <SimpleTooltip content="Clear Search">
            <X />
          </SimpleTooltip>
        </Button>
      </div>
      <SimpleTooltip content="Select Random">
        <Button
          variant="outline"
          class="size-9 p-2"
          onclick={() => onSelect?.("lucide:" + getRandom())}
        >
          <Shuffle class="size-4" />
        </Button>
      </SimpleTooltip>
    </div>

    <!-- Virtualized Grid -->
    <div
      bind:this={scrollContainer}
      class="flex-1 w-full overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
    >
      {#if $virtualizer}
        <div
          style="height: {$virtualizer.getTotalSize()}px; position: relative; width: 100%;"
        >
          {#each $virtualizer.getVirtualItems() as virtualRow (virtualRow.index)}
            <div
              class="absolute top-0 left-0 grid w-full grid-cols-10 justify-items-center gap-0"
              style="transform: translateY({virtualRow.start}px); height: {virtualRow.size}px;"
            >
              {#each filteredIcons.slice(virtualRow.index * COLUMNS, virtualRow.index * COLUMNS + COLUMNS) as iconName (iconName)}
                <SimpleTooltip content={iconName.split("-").join(" ")} delayDuration={300}>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="cursor-pointer"
                    onclick={() => {
                      onSelect?.("lucide:" + iconName);
                    }}
                    aria-label={iconName}
                  >
                    <LucideRenderer icon={iconName} />
                  </Button>
                </SimpleTooltip>
              {/each}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
