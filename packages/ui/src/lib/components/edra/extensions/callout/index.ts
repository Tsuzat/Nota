import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import CalloutWrapper from './CalloutWrapper.svelte';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: 'callout',
  content: 'paragraph+',
  group: 'block',
  defining: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      emoji: {
        default: '💡',
      },
    };
  },

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'callout',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[class=callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands, editor }) => {
          const { type = null } = editor.getAttributes(this.name);
          if (type) {
            return commands.lift(this.name);
          } else {
            return commands.toggleWrap(this.name);
          }
        },
    };
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\$callout\$$/,
        type: this.type,
        getAttributes: (match) => {
          return { emoji: match[1] };
        },
      }),
    ];
  },

  addNodeView() {
    return SvelteNodeViewRenderer(CalloutWrapper);
  },
});
