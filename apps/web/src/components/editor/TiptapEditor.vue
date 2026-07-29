<template>
  <div v-if="editor" class="relative">
    <div class="border-b px-4 py-2 flex gap-2 flex-wrap">
      <button @click="editor.chain().focus().toggleBold().run()" class="px-2 py-1 border rounded">B</button>
      <button @click="editor.chain().focus().toggleItalic().run()" class="px-2 py-1 border rounded">I</button>
      <span class="border-l mx-1"></span>
      <button @click="editor.chain().focus().setSceneHeading().run()" class="px-2 py-1 border rounded text-xs">场标</button>
      <button @click="editor.chain().focus().setCharacter().run()" class="px-2 py-1 border rounded text-xs">人物</button>
      <button @click="editor.chain().focus().setDialogue().run()" class="px-2 py-1 border rounded text-xs">对白</button>
      <button @click="editor.chain().focus().setAction().run()" class="px-2 py-1 border rounded text-xs">动作</button>
      <button @click="editor.chain().focus().setParenthetical().run()" class="px-2 py-1 border rounded text-xs">提示</button>
      <button @click="editor.chain().focus().setTransition().run()" class="px-2 py-1 border rounded text-xs">转场</button>
      <span class="border-l mx-1"></span>
      <button @click="editor.chain().focus().undo().run()" class="px-2 py-1 border rounded">撤销</button>
      <button @click="editor.chain().focus().redo().run()" class="px-2 py-1 border rounded">重做</button>
      <span class="border-l mx-1"></span>
      <span class="text-xs text-gray-500 self-center">输入 / 触发 AI</span>
      <span class="text-xs px-2 py-1 rounded ml-auto" :class="connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
        {{ connected ? '已同步' : '离线' }}
      </span>
    </div>
    <EditorContent :editor="editor" class="prose max-w-none p-4 script-editor" @keydown="onKeydown" />
    <SlashCommand
      :visible="slashVisible"
      @close="slashVisible = false"
      @result="insertAiResult"
      @error="showError"
    />
    <p v-if="errorMsg" class="text-red-600 text-sm px-4 py-2">{{ errorMsg }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { SceneHeading } from './nodes/SceneHeading';
import { Character } from './nodes/Character';
import { Dialogue } from './nodes/Dialogue';
import { Action } from './nodes/Action';
import { Parenthetical } from './nodes/Parenthetical';
import { Transition } from './nodes/Transition';
import { YjsSync } from './YjsSync';
import SlashCommand from '../SlashCommand.vue';
import { useYjsDoc } from '../../composables/useYjsDoc';
import { useAuthStore } from '../../stores/auth';
import { useRoute } from 'vue-router';

const editor = ref();
const slashVisible = ref(false);
const errorMsg = ref('');
const route = useRoute();
const auth = useAuthStore();

// 使用 projectId 作为协同 docId
const docId = `project:${route.params.id}`;
const { doc, connected } = useYjsDoc(docId, auth.accessToken ?? '');

// Yjs XmlFragment 作为 ProseMirror 文档
const yXmlFragment = doc.getXmlFragment('prosemirror');

onMounted(() => {
  editor.value = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      SceneHeading,
      Character,
      Dialogue,
      Action,
      Parenthetical,
      Transition,
      YjsSync.configure({ yXmlFragment }),
    ],
  });
});

function onKeydown(e: KeyboardEvent) {
  if (e.key === '/' && editor.value) {
    slashVisible.value = true;
  }
}

function insertAiResult(text: string) {
  if (!editor.value) return;
  editor.value.chain().focus().insertContent(text).run();
}

function showError(msg: string) {
  errorMsg.value = msg;
  setTimeout(() => { errorMsg.value = ''; }, 3000);
}

onBeforeUnmount(() => {
  if (editor.value) editor.value.destroy();
});
</script>

<style>
.scene-heading { font-weight: bold; text-transform: uppercase; margin: 1.5em 0 0.5em; }
.character-line { margin-left: 25%; font-weight: bold; text-transform: uppercase; }
.dialogue { margin-left: 25%; }
.action { margin: 0.5em 0; }
.parenthetical { margin-left: 30%; font-style: italic; color: #555; }
.transition { text-align: right; text-transform: uppercase; margin: 1em 0; }
</style>
