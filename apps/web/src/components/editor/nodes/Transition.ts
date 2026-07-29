// apps/web/src/components/editor/nodes/Transition.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    transition: {
      setTransition: () => ReturnType;
      toggleTransition: () => ReturnType;
    };
  }
}

export const Transition = Node.create({
  name: 'transition',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="transition"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div', mergeAttributes(HTMLAttributes, { 'data-type': 'transition', class: 'transition' }), 0,
  ],
  addCommands() {
    return {
      setTransition: () => ({ commands }) => commands.setNode(this.name),
      toggleTransition: () => ({ commands }) => commands.toggleWrap(this.name),
    };
  },
});
