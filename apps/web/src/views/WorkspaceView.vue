<template>
  <div>
    <AppHeader />
    <main class="p-4 max-w-4xl mx-auto">
      <div class="flex justify-between mb-4">
        <h1 class="text-xl font-bold">我的工作流</h1>
        <button @click="onCreate" class="bg-blue-600 text-white px-3 py-1 rounded">新建</button>
      </div>
      <ul class="divide-y bg-white rounded shadow">
        <li v-for="w in workflows" :key="w.id" class="py-2 px-4 flex justify-between">
          <RouterLink :to="`/workflows/${w.id}`" class="hover:underline">{{ w.title }}</RouterLink>
          <span class="text-sm text-gray-500">{{ new Date(w.updatedAt).toLocaleString() }}</span>
        </li>
        <li v-if="!workflows.length" class="py-4 text-center text-gray-500 text-sm">暂无工作流</li>
      </ul>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { workflowsApi } from '../api/workflows';
import { useAuthStore } from '../stores/auth';
import AppHeader from '../components/AppHeader.vue';

const workflows = ref<any[]>([]);
const auth = useAuthStore(); const router = useRouter();

onMounted(async () => {
  if (!auth.user) await auth.fetchMe();
  workflows.value = await workflowsApi.list();
});

async function onCreate() {
  const wf = await workflowsApi.create('未命名工作流');
  router.push(`/workflows/${wf.id}`);
}
</script>
