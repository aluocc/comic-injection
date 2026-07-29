<template>
  <div>
    <AppHeader />
    <main class="p-4 max-w-4xl mx-auto">
      <div class="flex justify-between mb-4">
        <h1 class="text-xl font-bold">我的项目</h1>
        <button @click="showNew = true" class="bg-blue-600 text-white px-3 py-1 rounded">新建项目</button>
      </div>
      <ul class="divide-y bg-white rounded shadow">
        <li v-for="p in projects" :key="p.id" class="py-2 px-4 flex justify-between">
          <RouterLink :to="`/projects/${p.id}/editor`" class="hover:underline">
            <span class="font-medium">{{ p.title }}</span>
            <span class="ml-2 text-xs text-gray-500">{{ typeLabel(p.type) }}</span>
          </RouterLink>
          <span class="text-sm text-gray-500">{{ new Date(p.updatedAt).toLocaleString() }}</span>
        </li>
        <li v-if="!projects.length" class="py-4 text-center text-gray-500 text-sm">暂无项目</li>
      </ul>

      <div v-if="showNew" class="fixed inset-0 bg-black/30 flex items-center justify-center" @click.self="showNew = false">
        <div class="bg-white p-6 rounded shadow w-80 space-y-3">
          <h2 class="font-bold">新建项目</h2>
          <input v-model="newTitle" placeholder="项目名称" class="w-full border px-3 py-2 rounded" />
          <select v-model="newType" class="w-full border px-3 py-2 rounded">
            <option value="novel">小说</option>
            <option value="script">剧本</option>
            <option value="article">文章</option>
          </select>
          <button @click="onCreate" class="w-full bg-blue-600 text-white py-2 rounded">创建</button>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useProjectsStore } from '../stores/projects';
import AppHeader from '../components/AppHeader.vue';

const store = useProjectsStore();
const router = useRouter();
const showNew = ref(false);
const newTitle = ref('');
const newType = ref<'novel' | 'script' | 'article'>('novel');

onMounted(() => store.fetchList());

function typeLabel(t: string) {
  return { novel: '小说', script: '剧本', article: '文章' }[t] ?? t;
}

async function onCreate() {
  if (!newTitle.value) return;
  const p = await store.create(newTitle.value, newType.value);
  showNew.value = false;
  newTitle.value = '';
  router.push(`/projects/${p.id}/editor`);
}
</script>
