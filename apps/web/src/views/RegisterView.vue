<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <form @submit.prevent="onSubmit" class="w-80 space-y-3 bg-white p-6 rounded shadow">
      <h1 class="text-xl font-bold">注册</h1>
      <input v-model="username" placeholder="用户名（至少 2 位）" class="w-full border px-3 py-2 rounded" required />
      <input v-model="password" type="password" placeholder="密码（至少 8 位）" class="w-full border px-3 py-2 rounded" required />
      <button class="w-full bg-blue-600 text-white py-2 rounded">注册</button>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <RouterLink to="/login" class="text-sm text-blue-600">已有账号？去登录</RouterLink>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const username = ref(''); const password = ref(''); const error = ref('');
const auth = useAuthStore(); const router = useRouter();

async function onSubmit() {
  error.value = '';
  try { await auth.register(username.value, password.value); await router.push('/'); }
  catch { error.value = '注册失败，用户名可能已被使用'; }
}
</script>
