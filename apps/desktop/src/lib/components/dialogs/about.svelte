<script lang="ts" module>
let open = $state(false);
export const openAboutDialog = () => {
  open = true;
};
</script>

<script lang="ts">
import * as Dialog from "@nota/ui/shadcn/dialog";
import { Separator } from "@nota/ui/shadcn/separator";
import { onMount } from "svelte";
import appIcon from "$lib/assets/static/icon.png";

let appVersion = $state("...");
let tauriVersion = $state("");

onMount(async () => {
  try {
    const { getVersion, getTauriVersion } = await import("@tauri-apps/api/app");
    appVersion = await getVersion();
    tauriVersion = await getTauriVersion();
  } catch {
    appVersion = "Unknown";
  }
});

const currentYear = new Date().getFullYear();

const techStack = [
  "SvelteKit",
  "Tauri v2",
  "TipTap",
  "SQLite",
];

const links: { label: string; href: string }[] = [
  { label: "Website", href: "https://nota.ink" },
  { label: "GitHub", href: "https://github.com/Tsuzat/Nota" },
  { label: "Releases", href: "https://github.com/Tsuzat/Nota/releases" },
];
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-sm gap-0 p-0 overflow-hidden">
    <!-- Header with icon and title -->
    <div class="flex flex-col items-center gap-4 px-6 pt-8 pb-4">
      <div class="relative">
        <div class="absolute -inset-3 rounded-3xl bg-linear-to-br from-primary/20 via-primary/5 to-transparent blur-xl"></div>
        <img
          src={appIcon}
          alt="Nota"
          class="relative size-20 rounded-2xl shadow-lg ring-1 ring-border/50"
          draggable="false"
        />
      </div>

      <div class="flex flex-col items-center gap-1 text-center">
        <Dialog.Title class="text-xl font-bold tracking-tight">Nota</Dialog.Title>
        <Dialog.Description class="text-muted-foreground text-sm">
          A fast, modern note taking app with native AI features
        </Dialog.Description>
      </div>

      <!-- Version badges -->
      <div class="flex items-center gap-2">
        <span class="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium">
          <span class="text-muted-foreground">v</span>{appVersion}
        </span>
        {#if tauriVersion}
          <span class="rounded-full bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground">
            Tauri {tauriVersion}
          </span>
        {/if}
      </div>
    </div>

    <Separator />

    <!-- Tech Stack -->
    <div class="flex flex-col items-center gap-2.5 px-6 py-4">
      <span class="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">Built with</span>
      <div class="flex flex-wrap justify-center gap-1.5">
        {#each techStack as tech}
          <span class="rounded-md bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border/30">
            {tech}
          </span>
        {/each}
      </div>
    </div>

    <Separator />

    <!-- Links -->
    <div class="flex items-center justify-center gap-4 px-6 py-4">
      {#each links as link}
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs font-medium text-primary/80 underline-offset-2 transition-colors hover:text-primary hover:underline"
        >
          {link.label}
        </a>
      {/each}
    </div>

    <Separator />

    <!-- Footer -->
    <div class="flex flex-col items-center gap-0.5 bg-muted/20 px-6 py-3">
      <p class="text-muted-foreground/60 text-[10px]">
        © {currentYear} Nota. All rights reserved.
      </p>
      <p class="text-muted-foreground/40 text-[10px]">
        Made with ♥ by Tsuzat
      </p>
    </div>
  </Dialog.Content>
</Dialog.Root>
