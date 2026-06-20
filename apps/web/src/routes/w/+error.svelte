<script lang="ts">
import { Button } from '@nota/ui/shadcn/button';
import { page } from '$app/state';
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
  <div class="max-w-md w-full text-center space-y-6">
    <div class="mx-auto flex size-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive animate-pulse">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-10">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
    
    <div class="space-y-2">
      <h1 class="text-3xl font-extrabold tracking-tight">Workspace Error</h1>
      <p class="text-muted-foreground text-sm leading-relaxed">
        {page.error?.message || "We encountered an issue loading this workspace. It might have been deleted, or you might not have access permissions."}
      </p>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Button variant="default" href="/w">
        Go to Workspaces
      </Button>
      <Button variant="outline" onclick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  </div>
</div>
