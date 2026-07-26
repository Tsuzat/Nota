<script lang="ts">
  import { resolve } from "$app/paths";
  import Applogo from "$lib/components/custom/applogo.svelte";
  import Particles from "$lib/components/custom/landing/particles.svelte";
  import { Button } from "@lib/components/ui/button";
  import { icons } from "@lib/icons";
  import { cn } from "@lib/utils";
  import ProBadge from "@nota/ui/custom/ProBadge.svelte";
</script>

<div
  class={cn(
    "relative w-full min-h-screen flex items-center justify-center p-4",
  )}
>
  <Particles class="fixed inset-0 -z-10" ease={20} quantity={120} />

  <div
    class="w-full max-w-md space-y-6 text-center border bg-card/80 backdrop-blur-md p-8 rounded-2xl shadow-xl"
  >
    <div class="flex justify-center">
      <Applogo />
    </div>

    <div class="flex justify-center my-4">
      <div
        class="h-16 w-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20 shadow-inner"
      >
        <icons.Check class="size-8 stroke-3" />
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-center gap-2">
        <h1 class="text-2xl font-bold tracking-tight">Payment Successful!</h1>
        <ProBadge />
      </div>
      <p class="text-sm text-muted-foreground">
        Thank you for upgrading to <strong>Nota Pro</strong>! Your account has
        been updated with full Pro features.
      </p>
    </div>

    <div
      class="rounded-xl bg-muted/40 p-4 text-left space-y-2 text-xs text-muted-foreground border"
    >
      <div class="flex items-center gap-2 text-foreground font-medium">
        <icons.Sparkles class="size-4 text-orange-500" />
        <span>What's unlocked:</span>
      </div>
      <ul class="space-y-1 pl-6 list-disc">
        <li>Unlimited Cloud Notes & Workspaces</li>
        <li>5 GB Cloud Storage</li>
        <li>Pro AI Credits & Features</li>
        <li>Real-time Collaboration & Backups</li>
      </ul>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 pt-2">
      <Button href={resolve("/profile")} class="w-full" variant="default">
        <icons.User />
        View Profile
      </Button>
      <Button href={resolve("/")} class="w-full" variant="outline">
        <icons.House />
        Back Home
      </Button>
    </div>
  </div>
</div>
