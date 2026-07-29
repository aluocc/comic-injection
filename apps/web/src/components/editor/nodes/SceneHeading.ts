// apps/web/src/components/editor/nodes/SceneHeading.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sceneHeading: {
      setSceneHeading: () => ReturnType;
      toggleSceneHeading: () => ReturnType;
    };
  }
}

export const SceneHeading = Node.create({
  name: 'sceneHeading',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-type="scene-heading"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div', mergeAttributes(HTMLAttributes, { 'data-type': 'scene-heading', class: 'scene-heading' }), 0,
  ],
  addCommands() {
    return {
      setSceneHeading: () => ({ commands }) => commands.setNode(this.name),
      toggleSceneHeading: () => ({ commands }) => commands.toggleWrap(this.name),
    };
  },
});
