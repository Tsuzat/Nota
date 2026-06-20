<script lang="ts">
import { getNotesContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import type { Editor } from '@nota/ui/edra/types.js';
import { icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Dropdown from '@nota/ui/shadcn/dropdown-menu';
import { cn } from '@nota/ui/utils';
import { timeAgo } from '@nota/ui/utils';
import { toast } from '@nota/ui/shadcn/sonner';

interface Props {
  starred?: boolean;
  toggleStar?: () => void;
  note: Note;
  editor?: Editor;
  useToolBar: boolean;
  useBubbleMenu: boolean;
  useDragHandle: boolean;
}

let {
  starred,
  toggleStar,
  note,
  editor,
  useToolBar = $bindable(true),
  useBubbleMenu = $bindable(true),
  useDragHandle = $bindable(true)
}: Props = $props();

const cloudNotes = getNotesContext();
let open = $state(false);

function downloadData(dataStr: string, fileName: string) {
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

async function exportAs(type: 'JSON' | 'HTML' | 'TEXT' | 'MD') {
  if (!editor) return;
  const id = toast.loading(`Exporting as ${type}...`);
  try {
    let dataStr = '';
    let ext = '';
    if (type === 'JSON') {
      dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editor.getJSON(), null, 2));
      ext = 'json';
    } else if (type === 'HTML') {
      dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(editor.getHTML());
      ext = 'html';
    } else if (type === 'TEXT') {
      dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(editor.getText());
      ext = 'txt';
    } else if (type === 'MD') {
      dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(editor.getMarkdown());
      ext = 'md';
    }
    downloadData(dataStr, `${note.name}.${ext}`);
    toast.success('Exported successfully', { id });
  } catch (err) {
    console.error(err);
    toast.error('Export failed', { id });
  }
}

async function duplicateNote() {
  try {
    await cloudNotes.duplicate(note.id);
    toast.success('Note duplicated successfully');
  } catch (err) {
    console.error(err);
    toast.error('Failed to duplicate note');
  }
}

async function trashNote() {
  const confirmed = confirm('Move this note to trash?');
  if (!confirmed) return;
  try {
    await cloudNotes.update(note.id, { deleted_at: new Date() });
    toast.success('Moved to Trash');
  } catch (err) {
    console.error(err);
    toast.error('Failed to move to trash');
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
          <icons.Lock class="size-4 mr-2" />
          Lock Page
        </Dropdown.CheckboxItem>
        <Dropdown.CheckboxItem bind:checked={useToolBar}>
          <icons.PenTool class="size-4 mr-2" />
          Toolbar
        </Dropdown.CheckboxItem>
        <Dropdown.CheckboxItem bind:checked={useBubbleMenu}>
          <icons.Bubbles class="size-4 mr-2" />
          Bubble Menu
        </Dropdown.CheckboxItem>
        <Dropdown.CheckboxItem bind:checked={useDragHandle}>
          <icons.GripVertical class="size-4 mr-2" />
          Drag Handle
        </Dropdown.CheckboxItem>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group>
        <Dropdown.Item
          onclick={() => cloudNotes.update(note.id, { is_public: !note.is_public })}
        >
          <icons.Globe class="size-4 mr-2" />
          {note.is_public ? "Make Private" : "Make Public"}
        </Dropdown.Item>
        <Dropdown.Item onclick={duplicateNote}>
          <icons.Copy class="size-4 mr-2" />
          Duplicate
        </Dropdown.Item>
        <Dropdown.Sub>
          <Dropdown.SubTrigger>
            <icons.ArrowRightFromLine class="size-4 mr-2" />
            Export As
          </Dropdown.SubTrigger>
          <Dropdown.SubContent>
            <Dropdown.Item onclick={() => exportAs('JSON')}>JSON</Dropdown.Item>
            <Dropdown.Item onclick={() => exportAs('HTML')}>HTML</Dropdown.Item>
            <Dropdown.Item onclick={() => exportAs('TEXT')}>Text</Dropdown.Item>
            <Dropdown.Item onclick={() => exportAs('MD')}>Markdown</Dropdown.Item>
          </Dropdown.SubContent>
        </Dropdown.Sub>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group>
        <Dropdown.Item onclick={trashNote} variant="destructive">
          <icons.Trash2 class="size-4 mr-2" />
          <span>Move to Trash</span>
        </Dropdown.Item>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Label class="font-normal text-sm text-muted-foreground">
        Word count: {editor?.storage.characterCount.words()}
      </Dropdown.Label>
      <Dropdown.Label class="font-normal text-sm text-muted-foreground">
        Last Edited: {timeAgo(note.updated_at)}
      </Dropdown.Label>
    </Dropdown.Content>
  </Dropdown.Root>
</div>
