<script lang="ts">
import { ToggleMode } from "@nota/ui/custom/index.ts";
import UserMenu from "./UserMenu.svelte";
</script>

<header
  class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
>
  <div class="flex h-14 items-center justify-between px-4 md:px-6">
    <nav class="flex gap-6 text-sm font-medium">
      <a
        href="/"
        class="text-muted-foreground hover:text-foreground transition-colors"
        >Home</a
      >
      <a
        href="/dashboard"
        class="text-muted-foreground hover:text-foreground transition-colors"
        >Dashboard</a
      >
    </nav>
    <div class="flex items-center gap-2">
      <ToggleMode />
      <UserMenu />
    </div>
  </div>
</header>
