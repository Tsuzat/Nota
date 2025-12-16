import { Extension } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface Storage {
    trackTasks: {
      total: number;
      completed: number;
    };
  }
}

export interface TrackTasksOptions {
  itemTypeNames?: string[];
  completedAttr?: string;
}

const countTasks = (doc: PMNode, itemTypeNames: string[], completedAttr: string) => {
  let total = 0;
  let completed = 0;
  doc.descendants((node) => {
    if (itemTypeNames.includes(node.type.name)) {
      total += 1;
      const v = node.attrs?.[completedAttr];
      if (v === true || v === 'true') {
        completed += 1;
      }
    }
  });
  return { total, completed };
};

export const TrackTasks = Extension.create<TrackTasksOptions>({
  name: 'trackTasks',
  addOptions() {
    return {
      itemTypeNames: ['taskItem'],
      completedAttr: 'checked',
    };
  },
  addStorage() {
    return {
      total: 0,
      completed: 0,
    };
  },
  onCreate() {
    const { total, completed } = countTasks(
      this.editor.state.doc,
      this.options.itemTypeNames ?? ['taskItem'],
      this.options.completedAttr ?? 'checked'
    );
    this.storage.total = total;
    this.storage.completed = completed;
  },
  onUpdate({ editor }) {
    const { total, completed } = countTasks(
      editor.state.doc,
      this.options.itemTypeNames ?? ['taskItem'],
      this.options.completedAttr ?? 'checked'
    );
    this.storage.total = total;
    this.storage.completed = completed;
  },
});
