<script lang="ts">
import { useEditorState } from '@lib/components/edra/tiptap';
import { convertHtmlToPdf, getNotesContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import type { Editor } from '@nota/ui/edra/tiptap/index.js';
import { icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Dropdown from '@nota/ui/shadcn/dropdown-menu';
import { toast } from '@nota/ui/shadcn/sonner';
import { cn, timeAgo } from '@nota/ui/utils';
import { getGlobalSettings } from '../settings/index.svelte';

interface Props {
  starred?: boolean;
  toggleStar?: () => void;
  note: Note;
  editor: Editor;
}

let { starred, toggleStar, note, editor }: Props = $props();

const cloudNotes = getNotesContext();
const globalSettings = getGlobalSettings();

const editorState = useEditorState({
  editor,
  selector: ({ editor }) => ({
    words: editor?.storage.characterCount.words() ?? 0,
  }),
});

let open = $state(false);

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
    const toastId = toast.loading('Generating PDF...', { duration: 10000 });
    try {
      content = await convertHtmlToPdf(name, editor.getHTML());
      toast.success('PDF generated', { id: toastId });
      mime = 'application/pdf';
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
      return;
    }
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name || 'Untitled'}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<div class="flex items-center gap-2 text-sm">
  <small class="text-muted-foreground">{$editorState.words} words</small>
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
          onclick={() =>
            cloudNotes.update(note.id, { is_public: !note.is_public })}
        >
          <icons.Globe />
          {note.is_public ? "Make Private" : "Make Public"}
        </Dropdown.Item>
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
      <Dropdown.Label class="font-normal text-sm text-muted-foreground">
        Word count: {$editorState.words}
      </Dropdown.Label>
      <Dropdown.Label class="font-normal text-sm text-muted-foreground">
        Last Edited: {timeAgo(note.updated_at)}
      </Dropdown.Label>
    </Dropdown.Content>
  </Dropdown.Root>
</div>
