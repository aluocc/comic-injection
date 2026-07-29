// apps/web/src/components/editor/YjsSync.ts
import { Extension } from '@tiptap/core';
import { ySyncPlugin } from 'y-prosemirror';
import type * as Y from 'yjs';

export const YjsSync = Extension.create<{ yXmlFragment: Y.XmlFragment }>({
  name: 'yjsSync',
  addOptions() {
    return { yXmlFragment: undefined as unknown as Y.XmlFragment };
  },
  addProseMirrorPlugins() {
    return [ySyncPlugin(this.options.yXmlFragment)];
  },
});
