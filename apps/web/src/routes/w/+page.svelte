<script lang="ts">
import { icons } from '@nota/ui/icons/index.js';
import { Button } from '@nota/ui/shadcn/button';
import { openNewWorkspace } from '$lib/components/dialogs/new-workspace.svelte';
</script>

<div class="flex h-screen w-full flex-col items-center justify-center p-6 bg-background text-foreground">
  <div class="max-w-md w-full text-center space-y-6">
    <div class="mx-auto flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-lg">
      <icons.FolderPlus class="size-10" />
    </div>

    <div class="space-y-2">
      <h1 class="text-3xl font-extrabold tracking-tight">Welcome to Nota</h1>
      <p class="text-muted-foreground text-sm leading-relaxed">
        Let's get started by creating your first cloud workspace. Workspaces help you group and organize your notes seamlessly.
      </p>
    </div>

    <div class="pt-2">
      <Button onclick={openNewWorkspace} size="lg" class="w-full gap-2">
        <icons.CirclePlus class="size-5" />
        Create Your First Workspace
      </Button>
    </div>
  </div>
</div>
