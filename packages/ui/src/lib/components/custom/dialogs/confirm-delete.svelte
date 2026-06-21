<script lang="ts" module>
  let open = $state(false);
  let confirmationText = $state("delete");
  let onConfirm = $state<() => Promise<void>>();

  export function confirmDelete(
    inputText: string,
    onConfirmCb: () => Promise<void>,
  ) {
    open = true;
    confirmationText = inputText;
    onConfirm = onConfirmCb;
  }
</script>

<script lang="ts">
  import * as Dialog from "@lib/components/ui/dialog";
  import { Button, buttonVariants } from "@lib/components/ui/button";
  import { Input } from "@lib/components/ui/input";
  import { BarSpinner } from "@lib/icons";
  let isDeleting = $state(false);
  let inputText = $state("");

  async function onDelete() {
    isDeleting = true;
    onConfirm?.()
      .then(() => {
        open = false;
      })
      .finally(() => {
        isDeleting = false;
      });
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Are you sure?</Dialog.Title>
      <Dialog.Description class="flex flex-col gap-2">
        <span>
          Type out <code
            class="bg-muted px-1 py-0.5 rounded text-muted-foreground"
            >{confirmationText}</code
          > to confirm the deletion of this workspace.
        </span>
        <Input placeholder={confirmationText} bind:value={inputText} />
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Dialog.Close class={buttonVariants({variant: "outline"})}>Cancel</Dialog.Close>
      <Button
        disabled={inputText !== confirmationText || isDeleting}
        variant="destructive"
        onclick={onDelete}
      >
        {#if isDeleting}
          <BarSpinner />
          Deleting...
        {:else}
          Delete
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
