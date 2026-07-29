import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authApi } from '../api/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; username: string; name: string } | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));

  async function login(username: string, password: string) {
    const { data } = await authApi.login(username, password);
    accessToken.value = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
    await fetchMe();
  }

  async function register(username: string, password: string) {
    await authApi.register(username, password);
    await login(username, password);
  }

  async function fetchMe() {
    try {
      const { data } = await authApi.me();
      user.value = data;
    } catch {
      logout();
    }
  }

  function logout() {
    accessToken.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
  }

  return { user, accessToken, login, register, fetchMe, logout };
});
