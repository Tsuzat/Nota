<script lang="ts">
import { useEditorState } from '@lib/components/edra/tiptap';
import { convertHtmlToPdf, getAuthContext, getNotesContext, getVersionsContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import type { Editor } from '@nota/ui/edra/tiptap/index.js';
import { icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@nota/ui/shadcn/dialog';
import * as Dropdown from '@nota/ui/shadcn/dropdown-menu';
import { Input } from '@nota/ui/shadcn/input';
import { toast } from '@nota/ui/shadcn/sonner';
import { cn, timeAgo } from '@nota/ui/utils';
import { getGlobalSettings } from '../settings/index.svelte';

interface Props {
  starred?: boolean;
  toggleStar?: () => void;
  note: Note;
  editor: Editor;
  versionCount?: number;
}

let { starred, toggleStar, note, editor, versionCount = $bindable(0) }: Props = $props();

const cloudNotes = getNotesContext();
const versionsClient = getVersionsContext();
const globalSettings = getGlobalSettings();
const authContext = getAuthContext();
const isPro = $derived(authContext.user?.subscription_plan === 'pro');

// versionCount is now a bindable prop — parent manages fetching.

const editorState = useEditorState({
  editor,
  selector: ({ editor }) => ({
    words: editor?.storage.characterCount.words() ?? 0,
  }),
});

let open = $state(false);

let snapshotDialogOpen = $state(false);
let snapshotLabel = $state('');
let isCreatingSnapshot = $state(false);

async function handleCreateSnapshot() {
  if (!note.id || !isPro) return;
  isCreatingSnapshot = true;
  try {
    await versionsClient.createManualSnapshot(note.id, snapshotLabel || undefined);
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

async function exportContent(editor: Editor, name: string, type: 'PDF' | 'JSON' | 'HTML' | 'TEXT' | 'MD') {
  let content: string | ArrayBuffer = '';
  let mime = 'text/plain';
  let ext = type.toLowerCase();

  if (type === 'JSON') {
    content = JSON.stringify(editor.getJSON(), null, 2);
    mime = 'application/json';
  } else if (type === 'HTML') {
    content = editor.getHTML();
    mime = 'text/html';
  } else if (type === 'TEXT') {
    content = editor.getText();
  } else if (type === 'MD') {
    content = editor.getMarkdown();
  } else if (type === 'PDF') {
    content = await convertHtmlToPdf(name, editor.getHTML());
    mime = 'application/pdf';
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name || 'Untitled'}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleExport(type: 'PDF' | 'JSON' | 'HTML' | 'TEXT' | 'MD') {
  if (!editor) return;
  toast.promise(exportContent(editor, note.name, type), {
    loading: `Exporting as ${type}...`,
    success: `${type} exported successfully`,
    error: `Failed to export ${type}`,
  });
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
            if (isPro) snapshotDialogOpen = true;
            else
              toast.error(
                "Cloud snapshots are only available on the Pro plan.",
              );
          }}
        >
          <icons.Save />
          Save Snapshot {!isPro ? "(Pro)" : ""}
        </Dropdown.Item>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group>
        <Dropdown.Item
          onclick={() => {
            cloudNotes.duplicate(note.id);
          }}
        >
          <icons.Copy />
          Duplicate
        </Dropdown.Item>
        <Dropdown.Sub>
          <Dropdown.SubTrigger>
            <icons.ArrowRightFromLine />
            Export As
          </Dropdown.SubTrigger>
          <Dropdown.SubContent>
            <Dropdown.Item onclick={() => handleExport("PDF")}
              >PDF</Dropdown.Item
            >
            <Dropdown.Item onclick={() => handleExport("JSON")}
              >JSON</Dropdown.Item
            >
            <Dropdown.Item onclick={() => handleExport("HTML")}
              >HTML</Dropdown.Item
            >
            <Dropdown.Item onclick={() => handleExport("TEXT")}
              >Text</Dropdown.Item
            >
            <Dropdown.Item onclick={() => handleExport("MD")}
              >Markdown</Dropdown.Item
            >
          </Dropdown.SubContent>
        </Dropdown.Sub>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group>
        <Dropdown.Item
          class="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-500/10"
          onclick={() => {
            cloudNotes.update(note.id, { deleted_at: new Date() });
          }}
        >
          <icons.Trash2 />
          <span>Move to Trash</span>
        </Dropdown.Item>
      </Dropdown.Group>
      <Dropdown.Separator />
      <div
        class="px-2 py-1.5 text-[10px] text-muted-foreground select-none leading-normal"
      >
        <div>
          Word count: {$editorState.words}
        </div>
        <div>{timeAgo(note.updated_at)}</div>
      </div>
    </Dropdown.Content>
  </Dropdown.Root>
</div>

<Dialog bind:open={snapshotDialogOpen}>
  <DialogContent class="sm:max-w-105">
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
      <p class="text-sm text-muted-foreground">
        Saved snapshots are permanently pinned in your version history and will
        not be overwritten by auto-saves.
      </p>
    </div>
    <DialogFooter>
      <Button
        variant="outline"
        onclick={() => (snapshotDialogOpen = false)}
        disabled={isCreatingSnapshot}
      >
        Cancel
      </Button>
      <Button onclick={handleCreateSnapshot} disabled={isCreatingSnapshot}>
        {isCreatingSnapshot ? "Saving..." : "Save"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
