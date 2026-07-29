<template>
  <div>
    <AppHeader />
    <main class="p-4 max-w-2xl mx-auto">
      <h1 class="text-xl font-bold mb-4">BYOK 设置</h1>
      <form @submit.prevent="onSave" class="space-y-3 bg-white p-4 rounded shadow">
        <div>
          <label class="block text-sm">供应商</label>
          <select v-model="provider" class="w-full border px-3 py-2 rounded">
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div>
          <label class="block text-sm">API Key</label>
          <input v-model="apiKey" type="password" class="w-full border px-3 py-2 rounded" required />
        </div>
        <button class="bg-blue-600 text-white px-3 py-1 rounded">保存</button>
        <p v-if="msg" class="text-sm text-green-600">{{ msg }}</p>
      </form>
      <h2 class="font-semibold mt-6 mb-2">已配置</h2>
      <ul class="text-sm divide-y bg-white rounded shadow">
        <li v-for="k in keys" :key="k.id" class="py-1 px-4">{{ k.provider }}</li>
        <li v-if="!keys.length" class="py-4 text-center text-gray-500">尚未配置任何供应商</li>
      </ul>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { providersApi } from '../api/providers';
import AppHeader from '../components/AppHeader.vue';

const provider = ref('openai');
const apiKey = ref('');
const keys = ref<any[]>([]);
const msg = ref('');

onMounted(async () => { keys.value = await providersApi.list(); });

async function onSave() {
  msg.value = '';
  await providersApi.upsert(provider.value, apiKey.value);
  apiKey.value = '';
  keys.value = await providersApi.list();
  msg.value = '已保存（加密存储）';
}
</script>
