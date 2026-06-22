<script lang="ts">
import { Button } from '@nota/ui/shadcn/button';
import { resolve } from '$app/paths';
</script>

<div class="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
  <div class="flex flex-col items-center gap-4 text-center">
    <h1 class="text-6xl font-bold tracking-tighter">Oops!</h1>
    <h2 class="text-2xl font-semibold text-muted-foreground">Something went wrong</h2>
    <p class="max-w-md text-muted-foreground mt-2">
      We couldn't load the requested page. It might have been moved or deleted.
    </p>
    <Button href={resolve("/home")} size="lg" class="mt-6">
      Return Home
    </Button>
  </div>
</div>
