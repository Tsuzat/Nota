<script lang="ts">
import { useEditorState } from '@lib/components/edra/tiptap';
import { getAuthContext, getNotesContext, getVersionsContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import type { Editor } from '@nota/ui/edra/tiptap/index.js';
import { BarSpinner, icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@nota/ui/shadcn/dialog';
import * as Dropdown from '@nota/ui/shadcn/dropdown-menu';
import { Input } from '@nota/ui/shadcn/input';
import { toast } from '@nota/ui/shadcn/sonner';
import { Switch } from '@nota/ui/shadcn/switch';
import { cn, timeAgo } from '@nota/ui/utils';
import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { getLocalVersions } from '$lib/local/versions.svelte';
import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { exportContent, importNotes } from '$lib/utils';
import { getGlobalSettings } from '../settings';

interface Props {
  starred?: boolean;
  toggleStar?: () => void;
  note: LocalNote | Note;
  editor: Editor;
  versionCount?: number;
}

let { starred, toggleStar, note, editor, versionCount = $bindable(0) }: Props = $props();

const localNotes = getLocalNotes();
const cloudNotes = getNotesContext();
const globalSettings = getGlobalSettings();
const workspace = $derived(
  getLocalWorkspaces()
    .getWorkspaces()
    .find((w) => w.id === note.workspace_id)
);
const authContext = getAuthContext();
const isPro = $derived(authContext.user?.subscription_plan === 'pro');

const editorState = useEditorState({
  editor,
  selector: ({ editor }) => ({
    words: editor?.storage.characterCount.words() ?? 0,
  }),
});

let open = $state(false);

const versionsClient = getVersionsContext();
const localVersions = getLocalVersions();

// versionCount is now a bindable prop — parent manages fetching.

let snapshotDialogOpen = $state(false);
let snapshotLabel = $state('');
let isCreatingSnapshot = $state(false);
let storeLocally = $state(false);
async function handleCreateSnapshot() {
  if (!note.id) return;
  if ('owner' in note && !isPro) {
    storeLocally = true;
  }
  isCreatingSnapshot = true;
  try {
    if ('owner' in note) {
      if (storeLocally) {
        await localVersions.createLocalSnapshot(
          note.id,
          note.workspace_id,
          editor.getJSON(),
          snapshotLabel || undefined,
          'manual',
          'cloud'
        );
      } else {
        await versionsClient.createManualSnapshot(note.id, snapshotLabel || undefined);
      }
    } else {
      await localVersions.createLocalSnapshot(
        note.id,
        note.workspace_id,
        editor.getJSON(),
        snapshotLabel || undefined,
        'manual'
      );
    }
    toast.success('Snapshot created');
    versionCount++;
    snapshotDialogOpen = false;
    snapshotLabel = '';
  } catch (err: any) {
    toast.error(err.message || 'Failed to create snapshot');
  } finally {
    isCreatingSnapshot = false;
  }
}
</script>

<div class="flex items-center gap-2 text-sm">
  <SimpleToolTip content="Toggle Pin">
    <Button variant="ghost" size="icon" onclick={toggleStar}>
      <icons.Pin class={cn(starred && "fill-yellow-500 text-yellow-500")} />
    </Button>
  </SimpleToolTip>
  <Dropdown.Root bind:open>
    <Dropdown.Trigger
      class={buttonVariants({
        variant: "ghost",
        size: "icon",
        class: "data-[state=open]:bg-accent",
      })}
    >
      <icons.Ellipsis />
    </Dropdown.Trigger>
    <Dropdown.Content class="bg-popover h-full w-fit overflow-auto" align="end">
      <Dropdown.Group>
        <Dropdown.GroupHeading class="text-muted-foreground text-sm"
          >Page Settings
        </Dropdown.GroupHeading>
        <Dropdown.CheckboxItem
          onclick={() => editor?.setEditable(!editor?.isEditable)}
          checked={!editor?.isEditable}
        >
          <icons.Lock />
          Lock Page
        </Dropdown.CheckboxItem>
        <Dropdown.CheckboxItem bind:checked={globalSettings.useToolBar}>
          <icons.PenTool />
          Toolbar
        </Dropdown.CheckboxItem>
        <Dropdown.CheckboxItem bind:checked={globalSettings.useBubbleMenu}>
          <icons.Bubbles />
          Bubble Menu
        </Dropdown.CheckboxItem>
        <Dropdown.CheckboxItem bind:checked={globalSettings.useDragHandle}>
          <icons.GripVertical />
          Drag Handle
        </Dropdown.CheckboxItem>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group>
  
        <Dropdown.Item
          onclick={() => {
            if ("owner" in note) cloudNotes.duplicate(note.id);
            else if (workspace) localNotes.duplicateNote(note.id);
          }}
        >
          <icons.Copy />
          Duplicate
        </Dropdown.Item>
        <Dropdown.Item onclick={() => importNotes(editor)}>
          <icons.ArrowDown />
          Import
        </Dropdown.Item>
        <Dropdown.Sub>
          <Dropdown.SubTrigger>
            <icons.ArrowRightFromLine />
            Export As
          </Dropdown.SubTrigger>
          <Dropdown.SubContent>
            <Dropdown.Item
              onclick={() => {
                if (editor) exportContent(editor, note.name, "PDF");
              }}>PDF</Dropdown.Item
            >
            <Dropdown.Item
              onclick={() => {
                if (editor) exportContent(editor, note.name, "JSON");
              }}>JSON</Dropdown.Item
            >
            <Dropdown.Item
              onclick={() => {
                if (editor) exportContent(editor, note.name, "HTML");
              }}>HTML</Dropdown.Item
            >
            <Dropdown.Item
              onclick={() => {
                if (editor) exportContent(editor, note.name, "TEXT");
              }}>Text</Dropdown.Item
            >
            <Dropdown.Item
              onclick={() => {
                if (editor) exportContent(editor, note.name, "MD");
              }}>Markdown</Dropdown.Item
            >
          </Dropdown.SubContent>
        </Dropdown.Sub>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group>
        <Dropdown.Item
          onclick={() => {
            if ("owner" in note && !isPro) {
              storeLocally = true;
            }
            snapshotDialogOpen = true;
          }}
        >
          <icons.Camera />
          Save Snapshot
        </Dropdown.Item>

      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group>
        <Dropdown.Item
          onclick={() => {
            if ("owner" in note)
              cloudNotes.update(note.id, { deleted_at: new Date() });
            else localNotes.trashNote(note);
          }}
        >
          <icons.Trash2 />
          <span>Move to Trash</span>
        </Dropdown.Item>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Label class="font-normal text-sm text-muted-foreground">
        Word count: {$editorState.words}
      </Dropdown.Label>
      <Dropdown.Label class="font-normal text-sm text-muted-foreground">
        Last Edited: {timeAgo(note.updated_at)}
      </Dropdown.Label>
    </Dropdown.Content>
  </Dropdown.Root>
</div>

<Dialog bind:open={snapshotDialogOpen}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Save Snapshot</DialogTitle>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <Input
        bind:value={snapshotLabel}
        placeholder="Snapshot label (optional)"
        onkeydown={(e) => {
          if (e.key === "Enter") handleCreateSnapshot();
        }}
      />
      {#if "owner" in note}
        <div class="flex items-center space-x-2">
          <Switch
            bind:checked={storeLocally}
            disabled={isCreatingSnapshot || !isPro}
            id="store-locally"
          />
          <label
            for="store-locally"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {storeLocally ? "Store Locally" : "Store In Cloud"}
            {!isPro ? " (Cloud Snapshot Requires Pro)" : ""}
          </label>
        </div>
      {/if}
    </div>
    <DialogFooter>
      <Button
        variant="outline"
        onclick={() => (snapshotDialogOpen = false)}
        disabled={isCreatingSnapshot}
      >
        Cancel
      </Button>
      <div class="flex gap-2">
        <Button onclick={handleCreateSnapshot} disabled={isCreatingSnapshot}>
          {#if isCreatingSnapshot}
            <BarSpinner size={16} class="mr-2" />
            Saving...
          {:else}
            Save
          {/if}
        </Button>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>
