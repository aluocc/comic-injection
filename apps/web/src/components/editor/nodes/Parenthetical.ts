// apps/web/src/components/editor/nodes/Parenthetical.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    parenthetical: {
      setParenthetical: () => ReturnType;
      toggleParenthetical: () => ReturnType;
    };
  }
}

export const Parenthetical = Node.create({
  name: 'parenthetical',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="parenthetical"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div', mergeAttributes(HTMLAttributes, { 'data-type': 'parenthetical', class: 'parenthetical' }), 0,
  ],
  addCommands() {
    return {
      setParenthetical: () => ({ commands }) => commands.setNode(this.name),
      toggleParenthetical: () => ({ commands }) => commands.toggleWrap(this.name),
    };
  },
});
