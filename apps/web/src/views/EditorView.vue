<template>
  <div class="h-screen flex flex-col">
    <AppHeader />
    <div class="flex-1 flex">
      <aside class="w-64 border-r bg-gray-50 p-3 overflow-auto">
        <h2 class="font-bold text-sm mb-2">章节</h2>
        <ul class="space-y-1 text-sm">
          <li v-for="c in chapters" :key="c.id" class="py-1 px-2 hover:bg-gray-100 rounded cursor-pointer">
            {{ c.title }}
          </li>
        </ul>
        <button @click="onAddChapter" class="mt-2 text-xs text-blue-600">+ 添加章节</button>
      </aside>
      <main class="flex-1 overflow-auto">
        <TiptapEditor />
      </main>
      <aside class="w-64 border-l bg-gray-50 p-3 overflow-auto">
        <h2 class="font-bold text-sm mb-2">人物</h2>
        <ul class="text-sm space-y-1">
          <li v-for="ch in characters" :key="ch.id" class="py-1">{{ ch.name }}</li>
        </ul>
        <h2 class="font-bold text-sm mt-4 mb-2">道具</h2>
        <ul class="text-sm space-y-1">
          <li v-for="p in props" :key="p.id" class="py-1">{{ p.name }}</li>
        </ul>
      </aside>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { projectsApi } from '../api/projects';
import { scriptsApi } from '../api/scripts';
import AppHeader from '../components/AppHeader.vue';
import TiptapEditor from '../components/editor/TiptapEditor.vue';

const route = useRoute();
const projectId = route.params.id as string;
const chapters = ref<any[]>([]);
const characters = ref<any[]>([]);
const props = ref<any[]>([]);

onMounted(async () => {
  chapters.value = await projectsApi.listChapters(projectId);
  characters.value = await scriptsApi.listCharacters(projectId);
  props.value = await scriptsApi.listProps(projectId);
});

async function onAddChapter() {
  const title = prompt('章节标题');
  if (!title) return;
  const c = await projectsApi.createChapter(projectId, title);
  chapters.value.push(c);
}
</script>
