// apps/web/src/components/editor/nodes/Action.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    action: {
      setAction: () => ReturnType;
      toggleAction: () => ReturnType;
    };
  }
}

export const Action = Node.create({
  name: 'action',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="action"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div', mergeAttributes(HTMLAttributes, { 'data-type': 'action', class: 'action' }), 0,
  ],
  addCommands() {
    return {
      setAction: () => ({ commands }) => commands.setNode(this.name),
      toggleAction: () => ({ commands }) => commands.toggleWrap(this.name),
    };
  },
});
