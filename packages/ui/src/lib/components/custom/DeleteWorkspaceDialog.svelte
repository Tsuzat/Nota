<script lang="ts" module>
  type DeleteWorkspaceDialogOptions = {
    workspaceName: string;
    onConfirm: () => Promise<void> | void;
    /** Reason why deletion is blocked (if any). Dialog shows this and disables confirm. */
    blockedReason?: string;
  };

  let open = $state(false);
  let options = $state<DeleteWorkspaceDialogOptions | null>(null);

  export function openDeleteWorkspaceDialog(opts: DeleteWorkspaceDialogOptions) {
    options = opts;
    open = true;
  }
</script>

<script lang="ts">
  import * as Dialog from '@lib/components/ui/dialog/index.js';
  import { Input } from '@lib/components/ui/input/index.js';
  import { Button } from '@lib/components/ui/button/index.js';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import {BarSpinner} from '@lib/icons';

  let confirmText = $state('');
  let loading = $state(false);

  // The phrase the user must type to confirm
  const requiredPhrase = $derived(options ? `Delete ${options.workspaceName}` : '');
  const isConfirmed = $derived(confirmText.trim() === requiredPhrase);
  const isBlocked = $derived(!!options?.blockedReason);

  function handleOpenChange(val: boolean) {
    open = val;
    if (!val) {
      confirmText = '';
      loading = false;
    }
  }

  async function handleDelete() {
    if (!isConfirmed || isBlocked || loading || !options) return;
    loading = true;
    try {
      await options.onConfirm();
      open = false;
    } finally {
      loading = false;
      confirmText = '';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && isConfirmed && !isBlocked) {
      handleDelete();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Trigger class="sr-only">open</Dialog.Trigger>

  <Dialog.Content showCloseButton={true} class="max-w-md gap-5">
    <Dialog.Header>
      <div class="flex items-center gap-2">
        <div class="bg-destructive/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <TriangleAlertIcon class="text-destructive size-4" />
        </div>
        <Dialog.Title class="text-base">Delete Workspace</Dialog.Title>
      </div>
      <Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
        This action is <strong class="text-foreground">permanent</strong>. All notes and assets in
        <strong class="text-foreground">{options?.workspaceName ?? ''}</strong> will be deleted and cannot be recovered.
      </Dialog.Description>
    </Dialog.Header>

    {#if isBlocked}
      <div class="flex items-start gap-2.5 rounded-lg border border-amber-300/50 bg-amber-50/80 p-3 dark:border-amber-700/50 dark:bg-amber-950/30">
        <TriangleAlertIcon class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p class="text-sm text-amber-700 dark:text-amber-300">{options?.blockedReason}</p>
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        <p class="text-muted-foreground text-xs">
          To confirm, type
          <kbd class="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs font-semibold">
            {requiredPhrase}
          </kbd>
          below:
        </p>
        <Input
          bind:value={confirmText}
          onkeydown={handleKeydown}
          placeholder={requiredPhrase}
          class="font-mono text-sm"
          autocomplete="off"
          spellcheck={false}
        />
      </div>
    {/if}

    <Dialog.Footer>
      <Dialog.Close>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancel</Button>
        {/snippet}
      </Dialog.Close>
      <Button
        variant="destructive"
        disabled={!isConfirmed || isBlocked || loading}
        onclick={handleDelete}
      >
        {#if loading}
          <BarSpinner />
        {/if}
        Delete Workspace
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
