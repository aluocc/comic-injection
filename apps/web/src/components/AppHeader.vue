<template>
  <header class="flex items-center justify-between px-4 py-2 border-b bg-white">
    <RouterLink to="/" class="font-bold">漫剧平台</RouterLink>
    <div class="flex items-center gap-3 text-sm">
      <RouterLink to="/community" class="hover:underline">社区</RouterLink>
      <RouterLink to="/achievements" class="hover:underline">成就</RouterLink>
      <RouterLink to="/learning" class="hover:underline">学习</RouterLink>
      <RouterLink to="/settings" class="hover:underline">设置</RouterLink>
      <button @click="onLogout" class="text-red-600">退出</button>
    </div>
  </header>
</template>
<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore(); const router = useRouter();
function onLogout() { auth.logout(); router.push('/login'); }
</script>
