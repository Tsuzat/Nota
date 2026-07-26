<script>
  import { page } from "$app/state";
  import Particles from "$lib/components/custom/landing/particles.svelte";
  import { Button } from "@lib/components/ui/button";
  import { icons } from "@lib/icons";
</script>

<Particles class="fixed -z-10 h-screen w-screen" />
<main class="flex h-screen w-screen items-center justify-center p-6">
  <div class="flex flex-col items-center gap-8 text-center">
    <div class="relative">
      <div
        class="absolute -inset-4 animate-pulse rounded-full bg-destructive/10 blur-xl"
      ></div>
      <div
        class="relative flex size-24 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10"
      >
        <icons.TriangleAlert
          class="size-10 text-destructive"
          strokeWidth={1.5}
        />
      </div>
    </div>

    <!-- Status code -->
    <div class="space-y-2">
      <h1
        class="bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-7xl font-black tracking-tighter text-transparent"
      >
        {page.status}
      </h1>
      <p class="max-w-md text-lg text-balance text-muted-foreground">
        {page.error?.message ||
          "The board you're looking for doesn't exist or you don't have access."}
      </p>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-3">
      <Button variant="outline" onclick={() => history.back()}>
        <icons.ArrowLeft />
        Go Back
      </Button>
      <Button onclick={() => (window.location.href = "/")} class="nodefault">
        <icons.House />
        Home
      </Button>
    </div>
  </div>
</main>
