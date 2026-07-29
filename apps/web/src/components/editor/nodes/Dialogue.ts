// apps/web/src/components/editor/nodes/Dialogue.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dialogue: {
      setDialogue: () => ReturnType;
      toggleDialogue: () => ReturnType;
    };
  }
}

export const Dialogue = Node.create({
  name: 'dialogue',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="dialogue"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div', mergeAttributes(HTMLAttributes, { 'data-type': 'dialogue', class: 'dialogue' }), 0,
  ],
  addCommands() {
    return {
      setDialogue: () => ({ commands }) => commands.setNode(this.name),
      toggleDialogue: () => ({ commands }) => commands.toggleWrap(this.name),
    };
  },
});
