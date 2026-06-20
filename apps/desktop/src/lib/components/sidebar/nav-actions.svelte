<script lang="ts">
import { getNotesContext, type Note } from '@nota/client';
import { SimpleToolTip } from '@nota/ui/custom/index.js';
import type { Editor } from '@nota/ui/edra/types.js';
import { icons } from '@nota/ui/icons/index.js';
import { Button, buttonVariants } from '@nota/ui/shadcn/button';
import * as Dropdown from '@nota/ui/shadcn/dropdown-menu';
import { cn } from '@nota/ui/utils';
import { getLocalNotes, type LocalNote } from '$lib/local/notes.svelte';
import { getLocalWorkspaces } from '$lib/local/workspaces.svelte';
import { exportContent, importNotes } from '$lib/utils';
import { timeAgo } from '@nota/ui/utils';
import { getGlobalSettings } from '../settings';

interface Props {
  starred?: boolean;
  toggleStar?: () => void;
  note: LocalNote | Note;
  editor?: Editor;
}

let { starred, toggleStar, note, editor }: Props = $props();

const localNotes = getLocalNotes();
const cloudNotes = getNotesContext();
const globalSettings = getGlobalSettings();
const workspace = $derived(
  getLocalWorkspaces()
    .getWorkspaces()
    .find((w) => w.id === note.workspace_id)
);

let open = $state(false);
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
        {#if "owner" in note}
          <Dropdown.Item
            onclick={() =>
              cloudNotes.update(note.id, { is_public: !note.is_public })}
          >
            <icons.Globe />
            {note.is_public ? "Make Private" : "Make Public"}
          </Dropdown.Item>
        {/if}
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
            if ("owner" in note) cloudNotes.update(note.id, {deleted_at: new Date()});
            else localNotes.trashNote(note);
          }}
        >
          <icons.Trash2 />
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
