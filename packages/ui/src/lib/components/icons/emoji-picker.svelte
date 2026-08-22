<script lang="ts" module>
export interface Emojis {
	[key: string]: EmojiItem[];
}

export interface EmojiItem {
	name: string;
	emoji: string;
}
</script>

<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import * as Tabs from "../ui/tabs/index";
  import * as Popover from "../ui/popover/index";
  import { Button, buttonVariants } from "../ui/button/index";
  import { Input } from "../ui/input/index";
  import Shuffle from "@lucide/svelte/icons/shuffle";
  import X from "@lucide/svelte/icons/x";
  import Search from "@lucide/svelte/icons/search";
  import SimpleTooltip from "../custom/simple-tooltip.svelte";
  import { createVirtualizer } from "@tanstack/svelte-virtual";
  import { getEmojis } from "./utils";

  interface Props {
    searchTerm?: string;
    onSelect?: (emoji: string) => void;
  }

  let emojis = $state<Emojis | null>(null);
  let categories = $state<string[]>([]);
  let selectedCategory = $state("Smileys & Emotion");
  let skinTone = $state("default");
  let debouncedSearchTerm = $state("");
  let debounceTimeout: number | null = null;


  onMount(async () => {
    emojis = await getEmojis();
    categories = Object.keys(emojis);
    if (!categories.includes(selectedCategory)) {
      selectedCategory = categories[0];
    }
  });

  onDestroy(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
  });

  const skinTones: Record<string, string> = {
    default: "✋",
    "light skin tone": "✋🏻",
    "medium-light skin tone": "✋🏼",
    "medium skin tone": "✋🏽",
    "medium-dark skin tone": "✋🏾",
    "dark skin tone": "✋🏿",
  };

  const categoriesEmojis: Record<string, string> = {
    "Smileys & Emotion": "😊",
    Component: "🧩",
    "People & Body": "👨‍👩‍👧‍👦",
    "Animals & Nature": "🐶",
    "Food & Drink": "🍔",
    "Travel & Places": "🌍",
    Activities: "⚽",
    Objects: "💡",
    Symbols: "❤️",
    Flags: "🏳️",
  };

  let { searchTerm = $bindable(""), onSelect }: Props = $props();

  const filteredEmojiCache = new Map<string, EmojiItem[]>();
  const MAX_CACHE_SIZE = 50;

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

  function getCacheKey(
    category: string,
    searchTerm: string,
    skinTone: string,
  ): string {
    return `${category}:${searchTerm}:${skinTone}`;
  }

  function applyFilters(
    catgEmojis: EmojiItem[],
    searchTerm: string,
    skinTone: string,
  ): EmojiItem[] {
    if (!catgEmojis) return [];

    const cacheKey = getCacheKey(selectedCategory, searchTerm, skinTone);

    if (filteredEmojiCache.has(cacheKey)) {
      return filteredEmojiCache.get(cacheKey)!;
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    let updatedEmojis: EmojiItem[];

    if (normalizedSearchTerm !== "") {
      updatedEmojis = emojis ? Object.values(emojis).flat() : [];
    } else {
      updatedEmojis = catgEmojis;
    }

    if (skinTone !== "default") {
      updatedEmojis = updatedEmojis.filter((emoji) =>
        emoji.name.includes(skinTone),
      );
    } else {
      updatedEmojis = updatedEmojis.filter(
        (emoji) => !emoji.name.includes("skin tone"),
      );
    }

    if (normalizedSearchTerm !== "") {
      updatedEmojis = updatedEmojis.filter((emoji) =>
        emoji.name.toLowerCase().includes(normalizedSearchTerm),
      );
    }

    if (filteredEmojiCache.size >= MAX_CACHE_SIZE) {
      const firstKey = filteredEmojiCache.keys().next().value;
      if (firstKey) filteredEmojiCache.delete(firstKey);
    }
    filteredEmojiCache.set(cacheKey, updatedEmojis);

    return updatedEmojis;
  }

  const activeSkinTone = $derived(
    selectedCategory === "People & Body" || debouncedSearchTerm.trim() !== ""
      ? skinTone
      : "default",
  );

  const filteredEmojis = $derived(
    emojis && categories.length > 0
      ? applyFilters(
          emojis[selectedCategory],
          debouncedSearchTerm,
          activeSkinTone,
        )
      : [],
  );

  function getRandom(): string {
    if (!emojis) return "";
    const allEmojis = Object.values(emojis).flat();
    const randomIndex = Math.floor(Math.random() * allEmojis.length);
    return allEmojis[randomIndex].emoji;
  }

  let scrollContainer = $state<HTMLElement | null>(null);
  const COLUMNS = 10;
  const ROW_HEIGHT = 40;

  const virtualizerOptions = $derived({
    count: Math.ceil(filteredEmojis.length / COLUMNS),
    getScrollElement: () => scrollContainer,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const virtualizer = createVirtualizer(virtualizerOptions);

  $effect(() => {
    untrack(() => $virtualizer).setOptions(virtualizerOptions);
  });
</script>

{#if emojis === null}
  <div
    class="flex h-96 w-full items-center justify-center text-sm text-muted-foreground"
  >
    Loading emojis...
  </div>
{:else}
  <Tabs.Root
    bind:value={selectedCategory}
    class="flex h-96 w-full flex-col gap-1"
  >
    <div class="flex w-full items-center justify-between gap-2 p-1">
      <div class="relative flex w-full items-center">
        <Input
          bind:value={searchTerm}
          placeholder="Search Emojis..."
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
          class="size-9 p-2 text-xl"
          onclick={() => onSelect?.("emoji:" + getRandom())}
        >
          <Shuffle />
        </Button>
      </SimpleTooltip>
      <Popover.Root>
        <Popover.Trigger
          class={buttonVariants({
            variant: "outline",
            class: "size-9 p-2 text-xl",
          })}
        >
          <SimpleTooltip content="Skin Tones">
            {skinTones[skinTone]}
          </SimpleTooltip>
        </Popover.Trigger>
        <Popover.Content class="bg-popover flex h-fit w-fit p-0">
          {#each Object.keys(skinTones) as st, idx (idx)}
            <Button
              variant="ghost"
              class="size-8 p-1 text-xl"
              onclick={() => (skinTone = st)}
            >
              <SimpleTooltip content={st}>
                {skinTones[st]}
              </SimpleTooltip>
            </Button>
          {/each}
        </Popover.Content>
      </Popover.Root>
    </div>

    <Tabs.Content value={selectedCategory} class="flex-1 w-full overflow-hidden mt-0">
      <div
        bind:this={scrollContainer}
        class="h-full w-full overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
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
                {#each filteredEmojis.slice(virtualRow.index * COLUMNS, virtualRow.index * COLUMNS + COLUMNS) as emoji (emoji.emoji)}
                  <SimpleTooltip content={emoji.name} delayDuration={300}>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-xl cursor-pointer"
                      onclick={() => {
                        onSelect?.("emoji:" + emoji.emoji);
                      }}
                      aria-label={emoji.name}
                    >
                      {emoji.emoji}
                    </Button>
                  </SimpleTooltip>
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Tabs.Content>

    <Tabs.List class="flex w-full items-center justify-evenly rounded-sm mt-auto mb-1">
      {#each categories as catergory, idx (idx)}
        <Tabs.Trigger value={catergory}>
          <SimpleTooltip content={catergory}>
            {categoriesEmojis[catergory]}
          </SimpleTooltip>
        </Tabs.Trigger>
      {/each}
    </Tabs.List>
  </Tabs.Root>
{/if}
