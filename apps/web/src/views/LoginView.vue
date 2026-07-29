<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <form @submit.prevent="onSubmit" class="w-80 space-y-3 bg-white p-6 rounded shadow">
      <h1 class="text-xl font-bold">登录</h1>
      <input v-model="username" placeholder="用户名" class="w-full border px-3 py-2 rounded" required />
      <input v-model="password" type="password" placeholder="密码" class="w-full border px-3 py-2 rounded" required />
      <button class="w-full bg-blue-600 text-white py-2 rounded">登录</button>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <RouterLink to="/register" class="text-sm text-blue-600">去注册</RouterLink>
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
  try { await auth.login(username.value, password.value); await router.push('/'); }
  catch { error.value = '登录失败，请检查用户名和密码'; }
}
</script>
