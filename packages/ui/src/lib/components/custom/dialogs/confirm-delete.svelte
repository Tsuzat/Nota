<script lang="ts" module>
let open = $state(false);
interface ConfirmDeleteParams {
	title?: string;
	description?: string;
	confirmation?: { text: string };
	warning?: { text: string; allowDelete?: boolean };
	buttonText?: string;
	onClick?: () => Promise<void>;
}

const DEFAULT_DELETE_DIALOG_PARAMS = $state<ConfirmDeleteParams>({
	title: "Delete",
	description: "Are you sure you want to delete?",
	buttonText: "Delete",
});

export const openDeleteConfirmation = ({
	title = "Delete",
	description = "Are you sure you want to delete?",
	confirmation,
	warning,
	buttonText = "Delete",
	onClick,
}: ConfirmDeleteParams) => {
	DEFAULT_DELETE_DIALOG_PARAMS.title = title;
	DEFAULT_DELETE_DIALOG_PARAMS.description = description;
	DEFAULT_DELETE_DIALOG_PARAMS.confirmation = confirmation;
	DEFAULT_DELETE_DIALOG_PARAMS.warning = warning;
	DEFAULT_DELETE_DIALOG_PARAMS.buttonText = buttonText;
	DEFAULT_DELETE_DIALOG_PARAMS.onClick = onClick;
	open = true;
};
</script>

<script lang="ts">
  import { BarSpinner } from "../../icons";

  import { Button, buttonVariants } from "../../ui/button";

  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogClose,
  } from "../../ui/dialog";
  import { Input } from "../../ui/input";

  let isDeleting = $state(false);
  let confirmationInputText = $state("");
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (open) {
      isDeleting = false;
      confirmationInputText = "";
      errorMsg = null;
    }
  });

  let allowDelete = $derived(
    !DEFAULT_DELETE_DIALOG_PARAMS.confirmation ||
      confirmationInputText === DEFAULT_DELETE_DIALOG_PARAMS.confirmation.text,
  );

  async function handleDelete() {
    isDeleting = true;
    errorMsg = null;
    try {
      await DEFAULT_DELETE_DIALOG_PARAMS.onClick?.();
      open = false;
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : "An error occurred";
    } finally {
      isDeleting = false;
    }
  }
</script>

<Dialog bind:open>
  <DialogTrigger class="sr-only">open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{DEFAULT_DELETE_DIALOG_PARAMS.title}</DialogTitle>
      <DialogDescription
        >{DEFAULT_DELETE_DIALOG_PARAMS.description}</DialogDescription
      >
    </DialogHeader>

    {#if DEFAULT_DELETE_DIALOG_PARAMS.warning}
      <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
        <p>
          <strong>Warning:</strong>
          {DEFAULT_DELETE_DIALOG_PARAMS.warning.text}
        </p>
      </div>
    {/if}

    {#if DEFAULT_DELETE_DIALOG_PARAMS.confirmation}
      <div class="space-y-2">
        <label for="delete-input" class="text-sm font-medium"
          >Type <strong>{DEFAULT_DELETE_DIALOG_PARAMS.confirmation.text}</strong
          > to confirm</label
        >
        <Input
          id="delete-input"
          bind:value={confirmationInputText}
          placeholder={DEFAULT_DELETE_DIALOG_PARAMS.confirmation.text}
        />
      </div>
    {/if}

    {#if errorMsg}
      <div class="text-sm font-medium text-destructive">
        {errorMsg}
      </div>
    {/if}
    <DialogFooter>
      <DialogClose class={buttonVariants({ variant: "outline" })}
        >Cancel</DialogClose
      >
      {#if !DEFAULT_DELETE_DIALOG_PARAMS.warning || DEFAULT_DELETE_DIALOG_PARAMS.warning.allowDelete}
        <Button
          variant="destructive"
          disabled={!allowDelete || isDeleting}
          onclick={handleDelete}
        >
          {#if isDeleting}
            <BarSpinner class="mr-2" />
          {/if}
          {DEFAULT_DELETE_DIALOG_PARAMS.buttonText}</Button
        >
      {/if}
    </DialogFooter>
  </DialogContent>
</Dialog>
