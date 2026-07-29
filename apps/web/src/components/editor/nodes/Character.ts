// apps/web/src/components/editor/nodes/Character.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    character: {
      setCharacter: () => ReturnType;
      toggleCharacter: () => ReturnType;
    };
  }
}

export const Character = Node.create({
  name: 'character',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="character"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div', mergeAttributes(HTMLAttributes, { 'data-type': 'character', class: 'character-line' }), 0,
  ],
  addCommands() {
    return {
      setCharacter: () => ({ commands }) => commands.setNode(this.name),
      toggleCharacter: () => ({ commands }) => commands.toggleWrap(this.name),
    };
  },
});
